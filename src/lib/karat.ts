/**
 * KARAT ERP Integration Types and Utilities
 * 
 * This module provides type-safe mapping and validation for KARAT ERP project data.
 */

import { ServiceProject } from '@/types/project';
import { logger } from './logger';

export type KaratProject = {
  projectId: string;
  projectName: string;
  companyId: string;
  companyName: string;
  country: string;
  version: string;
  hasPayrollModule: boolean;
  hasServicePatch: boolean;
  hasNewPatch: boolean;
  hasNewLegalPatch: boolean;
  lastInstalledPatchDate: Date | null;
  nextPlannedPatchDate: Date | null;
  lastUpdateDate: Date | null;
  updateTask: string | null;
  accountManager: string | null;
  jiraKey: string | null;
};

interface RawKaratProject {
  doklad_proj: string;
  nazev_proj: string;
  id_firmy: string;
  nazev_firmy: string;
  stat: string;
  verze: string;
  mzd_modul: string;
  patch_servis: string;
  patch_novy: string;
  patch_novy_leg: string;
  patch_nas_poz: string;
  patch_nas_posl: string;
  patch_nas_pl: string;
  update_poz: string;
  update_task: string;
  osoba_pps: string;
  patch_task: string;
}

/**
 * Parses a date string from KARAT ERP system
 * Returns null for empty dates or the default "1901-01-01T00:00:00"
 * Returns Date object for valid ISO date strings
 */
function parseKaratDate(dateString: string): Date | null {
  if (!dateString || dateString.trim() === '') {
    return null;
  }
  
  try {
    // Remove leading/trailing whitespace
    const trimmed = dateString.trim();
    const date = new Date(trimmed);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (error) {
    return null;
  }
}

/**
 * Converts string "0"/"1" to boolean
 * Handles various string representations and edge cases
 */
function parseBoolean(value: string): boolean {
  if (!value || value.trim() === '') {
    return false;
  }
  
  const trimmed = value.trim().toLowerCase();
  return trimmed === '1' || trimmed === 'true' || trimmed === 'yes';
}

/**
 * Safely trims string value, returns null for empty/undefined values
 */
function parseString(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }
  
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Maps raw KARAT project data to the standardized KaratProject type
 * 
 * @param raw - Raw project object from KARAT ERP
 * @returns Mapped KaratProject object
 * @throws Error when required fields are missing or invalid
 */
export function mapKaratProject(raw: any): KaratProject {
  // Validate that raw is an object
  if (!raw || typeof raw !== 'object') {
    throw new Error('Raw project data must be an object');
  }

  // Extract and validate required fields
  const projectId = parseString(raw.doklad_proj);
  const projectName = parseString(raw.nazev_proj);
  const companyId = parseString(raw.id_firmy);
  const companyName = parseString(raw.nazev_firmy);
  const country = parseString(raw.stat);
  const version = parseString(raw.verze);

  // Check required fields
  const requiredFields = [
    { field: 'projectId', value: projectId },
    { field: 'projectName', value: projectName },
    { field: 'companyId', value: companyId },
    { field: 'companyName', value: companyName },
    { field: 'country', value: country },
    { field: 'version', value: version }
  ];

  for (const { field, value } of requiredFields) {
    if (!value) {
      throw new Error(`Required field '${field}' is missing or empty in project data`);
    }
  }

  // Map the complete project
  return {
    projectId: projectId!,
    projectName: projectName!,
    companyId: companyId!,
    companyName: companyName!,
    country: country!,
    version: version!,
    hasPayrollModule: parseBoolean(raw.mzd_modul),
    hasServicePatch: parseBoolean(raw.patch_servis),
    hasNewPatch: parseBoolean(raw.patch_novy),
    hasNewLegalPatch: parseBoolean(raw.patch_novy_leg),
    lastInstalledPatchDate: parseKaratDate(raw.patch_nas_posl),
    nextPlannedPatchDate: parseKaratDate(raw.patch_nas_pl),
    lastUpdateDate: parseKaratDate(raw.update_poz),
    updateTask: parseString(raw.update_task),
    accountManager: parseString(raw.osoba_pps),
    jiraKey: parseString(raw.patch_task)
  };
}

/**
 * Maps an array of raw KARAT project data to KaratProject objects
 * 
 * @param rawArray - Array of raw project objects from KARAT ERP
 * @returns Array of mapped KaratProject objects
 * Invalid records are skipped with console warnings
 */
/**
 * Maps raw KARAT project data to the standardized ServiceProject type
 * 
 * @param raw - Raw project object from KARAT ERP /web/patchovani_data
 * @returns Mapped ServiceProject object
 */
export function mapServiceProject(raw: any): ServiceProject {
  // Validate that raw is an object
  if (!raw || typeof raw !== 'object') {
    throw new Error('Raw service project data must be an object');
  }

  // Extract and validate required fields
  const doklad_proj = raw.doklad_proj || ''; // Použijeme doklad_proj místo projekt
  const nazev = raw.nazev_proj || ''; // Použijeme nazev_proj místo nazev
  
  // Extrahujeme JIRA klíč z patch_task (substring před '-')
  let jira_klic = '';
  if (raw.patch_task) {
    const patchTaskStr = String(raw.patch_task);
    const dashIndex = patchTaskStr.indexOf('-');
    if (dashIndex > 0) {
      jira_klic = patchTaskStr.substring(0, dashIndex);
    } else {
      jira_klic = patchTaskStr;
    }
  }
  
  const nazev_par = raw.nazev_firmy || '';
  const gps = raw.gps || '';

  // Map the service project
  return {
    doklad_proj,
    nazev,
    jira_klic,
    nazev_par,
    gps
  };
}

/**
 * Maps an array of raw KARAT project data to ServiceProject objects
 * 
 * @param rawArray - Array of raw project objects from KARAT ERP /web/patchovani_data
 * @returns Array of mapped ServiceProject objects
 * Invalid records are skipped with console warnings
 */
export function mapServiceProjects(rawArray: any[]): ServiceProject[] {
  if (!Array.isArray(rawArray)) {
    logger.log('Raw data is not an array:', rawArray)
    return []
  }
  
  logger.log(`Processing ${rawArray.length} raw service projects`)
  
  const projects: ServiceProject[] = []
  
  for (let i = 0; i < rawArray.length; i++) {
    const raw = rawArray[i];
    
    try {
      const project = mapServiceProject(raw)
      projects.push(project)
      logger.log(`✅ Mapped service project ${i + 1}: ${project.nazev}`)
    } catch (error: any) {
      logger.error(`❌ Failed to map service project ${i + 1}:`, error)
      // Project mapping failed, continue with next
    }
  }

  logger.log(`Successfully mapped ${projects.length} out of ${rawArray.length} service projects`)
  return projects
}

/**
 * Validates if a project object matches the ServiceProject type structure
 * Useful for runtime type checking
 */
export function isValidServiceProject(project: any): project is ServiceProject {
  if (!project || typeof project !== 'object') {
    return false;
  }

  const requiredFields: (keyof ServiceProject)[] = [
    'doklad_proj', 'nazev', 'jira_klic', 'nazev_par', 'gps'
  ];

  for (const field of requiredFields) {
    if (!(field in project)) {
      return false;
    }
  }

  return true;
}

export function mapKaratProjects(rawArray: any[]): KaratProject[] {
  if (!Array.isArray(rawArray)) {
    logger.log('Raw data is not an array:', rawArray)
    return []
  }
  
  logger.log(`Processing ${rawArray.length} raw projects`)
  const projects: KaratProject[] = []
  
  for (let i = 0; i < rawArray.length; i++) {
    const raw = rawArray[i]
    
    try {
      const project = mapKaratProject(raw)
      projects.push(project)
      logger.log(`Mapped project ${i + 1}: ${project.projectName}`)
    } catch (error: any) {
      logger.error(`Failed to map project ${i + 1}:`, error)
      // Project mapping failed, continue with next
    }
  }

  logger.log(`Successfully mapped ${projects.length} out of ${rawArray.length} projects`)
  return projects
}


/**
 * Validates if a project object matches the KaratProject type structure
 * Useful for runtime type checking
 */
export function isValidKaratProject(project: any): project is KaratProject {
  if (!project || typeof project !== 'object') {
    return false;
  }

  const requiredFields: (keyof KaratProject)[] = [
    'projectId', 'projectName', 'companyId', 'companyName', 
    'country', 'version', 'hasPayrollModule', 'hasServicePatch',
    'hasNewPatch', 'hasNewLegalPatch'
  ];

  for (const field of requiredFields) {
    if (!(field in project)) {
      return false;
    }
  }

  // Check optional fields exist and are of correct type
  const optionalFields: (keyof KaratProject)[] = [
    'lastInstalledPatchDate', 'nextPlannedPatchDate', 'lastUpdateDate',
    'updateTask', 'accountManager', 'jiraKey'
  ];

  for (const field of optionalFields) {
    if (field in project) {
      const value = project[field];
      if (field.includes('Date') && value !== null && !(value instanceof Date)) {
        return false;
      }
      if (!field.includes('Date') && value !== null && typeof value !== 'string') {
        return false;
      }
    }
  }

  return true;
}

/**
 * Example usage:
 * 
 * ```typescript
 * import { mapKaratProjects, KaratProject } from '@/lib/karat';
 * 
 * // Raw data from KARAT ERP
 * const rawData = [
 *   {
 *     "doklad_proj": "19PRSE0100000002",
 *     "nazev_proj": "ABS Jets - Servisní podpora IS KARAT",
 *     "id_firmy": "ABS_JETS",
 *     "nazev_firmy": "ABS Jets, a.s.",
 *     "stat": "CZ",
 *     "verze": "25.002",
 *     "mzd_modul": "0",
 *     "patch_servis": "1",
 *     "patch_novy": "0",
 *     "patch_novy_leg": "0",
 *     "patch_nas_poz": "1901-01-01T00:00:00",
 *     "patch_nas_posl": "2026-01-27T00:00:00",
 *     "patch_nas_pl": "2026-02-20T00:00:00",
 *     "update_poz": "1901-01-01T00:00:00",
 *     "update_task": "",
 *     "osoba_pps": "Tomáš Kovařík",
 *     "patch_task": "ABSERP-887"
 *   }
 * ];
 * 
 * // Map to typed projects
 * const projects: KaratProject[] = mapKaratProjects(rawData);
 * 
 * // Use the typed data
 * projects.forEach(project => {
 *   console.log(`Project: ${project.projectName} (${project.projectId})`);
 *   console.log(`Company: ${project.companyName} (${project.companyId})`);
 *   console.log(`Next patch: ${project.nextPlannedPatchDate?.toLocaleDateString() || 'Not scheduled'}`);
 * });
 * ```
 */
