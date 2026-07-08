#!/usr/bin/env python3
"""
Připraví public/lab/robot.glb z Meshy exportu:
 - baseColor přemapuje na ITMAN paletu (bílá / tmavě modrá / zelená / svítící oči)
 - vygeneruje emissive mapu (oči + zelené akcenty)
 - zahodí metallicRoughness texturu (nahrazena konstantami)
 - textury zmenší na 1024px (menší soubor)
Spuštění: python3 scripts/prepare-robot-glb.py
"""
import io
import json
import struct

import numpy as np
from PIL import Image, ImageFilter

SRC = 'public/lab/reference/Meshy_AI_Snowbyte_0703073158_texture.glb'
DST = 'public/lab/robot.glb'
TEX_SIZE = 1024
# Rozlišení mřížky pro geometrickou masku (viz build_region_grid)
GRID = 1024


def read_glb(path):
    with open(path, 'rb') as f:
        data = f.read()
    off = 12
    json_len, _ = struct.unpack_from('<II', data, off)
    gltf = json.loads(data[off + 8:off + 8 + json_len])
    bin_off = off + 8 + json_len
    bin_len, _ = struct.unpack_from('<II', data, bin_off)
    return gltf, data[bin_off + 8:bin_off + 8 + bin_len]


def image_bytes(gltf, bin_data, idx):
    bv = gltf['bufferViews'][gltf['images'][idx]['bufferView']]
    start = bv.get('byteOffset', 0)
    return bin_data[start:start + bv['byteLength']]


def read_accessor(gltf, bin_data, idx):
    acc = gltf['accessors'][idx]
    bv = gltf['bufferViews'][acc['bufferView']]
    start = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    dtypes = {5126: np.float32, 5125: np.uint32, 5123: np.uint16}
    ncomp = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[acc['type']]
    a = np.frombuffer(bin_data, dtype=dtypes[acc['componentType']],
                      count=acc['count'] * ncomp, offset=start)
    return a.reshape(-1, ncomp) if ncomp > 1 else a


def build_navy_mask(gltf, bin_data):
    """Rasterizuje do UV prostoru masku 'tady smí být tmavě modrá'.

    AI textura má tmavé skvrny i na místech, kde má být bílá skořepina
    (paže, tělo). Podle 3D pozice vrcholů povolíme navy jen ve visoru,
    na krčních prstencích a na prstencích podstavce; zbytek se přebarví
    na bílou.
    """
    from PIL import ImageDraw

    prim = gltf['meshes'][0]['primitives'][0]
    pos = read_accessor(gltf, bin_data, prim['attributes']['POSITION'])
    uv = read_accessor(gltf, bin_data, prim['attributes']['TEXCOORD_0'])
    idx = read_accessor(gltf, bin_data, prim['indices']).astype(np.int64)

    y = pos[:, 1]
    radial = np.sqrt(pos[:, 0] ** 2 + pos[:, 2] ** 2)
    allow = (
        ((y > 0.52) & (y < 0.90))                    # visor (pás hlavy)
        | ((radial < 0.24) & (y > 0.30) & (y < 0.62))   # krk
        | ((radial < 0.24) & (y > -0.86) & (y < -0.42))  # prstence podstavce
    )

    tri = idx.reshape(-1, 3)
    tri_allow = allow[tri].all(axis=1)
    mask_img = Image.new('L', (GRID, GRID), 0)
    draw = ImageDraw.Draw(mask_img)
    uv_px = np.clip(uv * (GRID - 1), 0, GRID - 1)
    for t in tri[tri_allow]:
        p = uv_px[t]
        draw.polygon([tuple(p[0]), tuple(p[1]), tuple(p[2])], fill=255)
    mask_img = mask_img.filter(ImageFilter.MaxFilter(5))
    return np.asarray(mask_img) > 127


def clean_basecolor(img, navy_allowed):
    """Přemapování zašuměné AI textury na čistou ITMAN paletu."""
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b

    green_score = np.clip((g - np.maximum(r, b)) / 35.0, 0, 1) * np.clip((g - 55) / 35.0, 0, 1)
    # oči = pouze výrazně světlá azurová (jinak by mapa chytala modrošedé stíny)
    blue_score = (
        np.clip((b - r - 30) / 30.0, 0, 1)
        * np.clip((b - 130) / 40.0, 0, 1)
        * np.clip((g - 100) / 50.0, 0, 1)
    )
    dark_score = np.clip((72 - lum) / 35.0, 0, 1)
    light_score = np.clip((lum - 95) / 55.0, 0, 1) + 0.12  # bias: nejisté -> bílá

    def blur(x, rad):
        im = Image.fromarray((np.clip(x, 0, 1) * 255).astype(np.uint8))
        return np.asarray(im.filter(ImageFilter.GaussianBlur(rad))).astype(np.float32) / 255.0

    scores = np.stack([
        blur(light_score, 3),
        blur(dark_score, 3),
        blur(green_score, 3) * 1.5,
        blur(blue_score, 1) * 2.2,
    ])
    cls = np.argmax(scores, axis=0)  # 0 bílá, 1 navy, 2 zelená, 3 oči
    # medián odstraní drobné misklasifikované skvrny (mramorování)
    cls_img = Image.fromarray((cls * 60).astype(np.uint8)).filter(ImageFilter.MedianFilter(9))
    cls = (np.asarray(cls_img).astype(np.int32) + 30) // 60
    # navy jen tam, kde ji geometrie povoluje (visor, krk, prstence podstavce)
    allowed = np.asarray(
        Image.fromarray(navy_allowed.astype(np.uint8) * 255).resize(cls.shape[::-1], Image.NEAREST)
    ) > 127
    cls[(cls == 1) & ~allowed] = 0

    out = np.zeros_like(a)
    # téměř jednolitá bílá — reference (itman.cz) je čistá, bez špinavých skvrn;
    # jemné stínování dodá až PBR osvětlení ve scéně
    ln = blur(np.clip((lum - 60) / 195.0, 0, 1), 6)
    white = np.stack([240 + 10 * ln, 242 + 9 * ln, 246 + 7 * ln], -1)
    dn = blur(np.clip(lum / 80.0, 0, 1), 4)
    navy = np.stack([14 + 10 * dn, 22 + 14 * dn, 38 + 22 * dn], -1)
    gn = blur(np.clip(lum / 190.0, 0.45, 1.0), 4)
    green = np.stack([73 * gn, 177 * gn, 65 * gn], -1)
    eye = np.broadcast_to(np.array([168.0, 236.0, 255.0]), a.shape)

    for i, layer in enumerate([white, navy, green, eye]):
        m = cls == i
        out[m] = layer[m]

    res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    return res.filter(ImageFilter.GaussianBlur(0.8)), cls


def make_emissive(cls):
    """Emissive mapa: oči svítí azurově, zelené akcenty jemně zeleně."""
    out = np.zeros((*cls.shape, 3), dtype=np.uint8)
    out[cls == 3] = (150, 225, 255)
    out[cls == 2] = (28, 80, 24)
    img = Image.fromarray(out).filter(ImageFilter.GaussianBlur(1.5))
    return img


def to_jpeg(img, size, quality=86):
    img = img.resize((size, size), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=quality)
    return buf.getvalue()


def main():
    gltf, bin_data = read_glb(SRC)

    base = Image.open(io.BytesIO(image_bytes(gltf, bin_data, 0)))

    navy_allowed = build_navy_mask(gltf, bin_data)
    cleaned, cls = clean_basecolor(base, navy_allowed)
    emissive = make_emissive(cls)

    # Normal mapa z AI generátoru je zašuměná (mramorování) — vynecháváme ji,
    # předloha je hladký plast.
    new_images = [
        to_jpeg(cleaned, TEX_SIZE),
        to_jpeg(emissive, TEX_SIZE, quality=80),
    ]

    # --- přestavba binárního bufferu: mesh bufferViews zachovat, obrazové nahradit
    old_image_bvs = {img['bufferView'] for img in gltf['images']}
    new_bin = bytearray()
    bv_map = {}
    new_bvs = []

    def align4():
        while len(new_bin) % 4:
            new_bin.append(0)

    for i, bv in enumerate(gltf['bufferViews']):
        if i in old_image_bvs:
            continue
        align4()
        start = bv.get('byteOffset', 0)
        chunk = bin_data[start:start + bv['byteLength']]
        nbv = dict(bv)
        nbv['byteOffset'] = len(new_bin)
        nbv['buffer'] = 0
        bv_map[i] = len(new_bvs)
        new_bvs.append(nbv)
        new_bin.extend(chunk)

    image_bv_indices = []
    for blob in new_images:
        align4()
        image_bv_indices.append(len(new_bvs))
        new_bvs.append({'buffer': 0, 'byteOffset': len(new_bin), 'byteLength': len(blob)})
        new_bin.extend(blob)
    align4()

    for acc in gltf['accessors']:
        acc['bufferView'] = bv_map[acc['bufferView']]

    gltf['bufferViews'] = new_bvs
    gltf['buffers'] = [{'byteLength': len(new_bin)}]
    gltf['images'] = [
        {'mimeType': 'image/jpeg', 'bufferView': image_bv_indices[0], 'name': 'baseColor'},
        {'mimeType': 'image/jpeg', 'bufferView': image_bv_indices[1], 'name': 'emissive'},
    ]
    sampler = gltf.get('samplers', [{}])[0] if gltf.get('samplers') else {}
    gltf['samplers'] = [sampler]
    gltf['textures'] = [{'source': 0, 'sampler': 0}, {'source': 1, 'sampler': 0}]
    gltf['materials'] = [{
        'name': 'itman-robot',
        'pbrMetallicRoughness': {
            'baseColorTexture': {'index': 0},
            'metallicFactor': 0.08,
            'roughnessFactor': 0.5,
        },
        'emissiveTexture': {'index': 1},
        'emissiveFactor': [1.0, 1.0, 1.0],
        'doubleSided': False,
    }]

    json_blob = json.dumps(gltf, separators=(',', ':')).encode()
    while len(json_blob) % 4:
        json_blob += b' '
    total = 12 + 8 + len(json_blob) + 8 + len(new_bin)
    with open(DST, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(json_blob), 0x4E4F534A))
        f.write(json_blob)
        f.write(struct.pack('<II', len(new_bin), 0x004E4942))
        f.write(new_bin)
    print(f'OK -> {DST} ({total / 1e6:.1f} MB)')

    cleaned.resize((512, 512)).save('/tmp/robot_base_preview.png')
    emissive.resize((512, 512)).save('/tmp/robot_emissive_preview.png')


if __name__ == '__main__':
    main()
