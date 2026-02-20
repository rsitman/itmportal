--
-- PostgreSQL database dump
--

\restrict 7Vg5iWvE5Rk580coW99GInP5iqZTWhEp2I9CgfMyVLSupbqDjMH4OsePW6dO0i3

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: admin
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AuthProvider; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."AuthProvider" AS ENUM (
    'LOCAL',
    'AZURE_AD'
);


ALTER TYPE public."AuthProvider" OWNER TO admin;

--
-- Name: EventType; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."EventType" AS ENUM (
    'PROJECT',
    'MEETING',
    'HOLIDAY',
    'OTHER',
    'ERP_UPGRADE',
    'ERP_PATCH'
);


ALTER TYPE public."EventType" OWNER TO admin;

--
-- Name: SessionPreference; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."SessionPreference" AS ENUM (
    'REMEMBER',
    'TEMPORARY'
);


ALTER TYPE public."SessionPreference" OWNER TO admin;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'USER',
    'IT'
);


ALTER TYPE public."UserRole" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Event; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    type public."EventType" NOT NULL,
    "allDay" boolean DEFAULT false NOT NULL,
    "outlookId" text,
    "ownerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "erpJiraKey" text,
    "erpProject" text,
    "erpResolver" text,
    "erpSourceId" text,
    "erpSystems" text,
    "erpType" text,
    "isErpEvent" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Event" OWNER TO admin;

--
-- Name: Page; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Page" (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Page" OWNER TO admin;

--
-- Name: PageComponent; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."PageComponent" (
    id text NOT NULL,
    "pageId" text NOT NULL,
    type text NOT NULL,
    "order" integer NOT NULL,
    "contentConfig" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PageComponent" OWNER TO admin;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."RolePermission" (
    id text NOT NULL,
    role public."UserRole" NOT NULL,
    permission text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO admin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    password text,
    "externalId" text,
    "authProvider" public."AuthProvider" DEFAULT 'LOCAL'::public."AuthProvider" NOT NULL,
    image text,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rememberLogin" boolean DEFAULT true NOT NULL,
    "sessionPreference" public."SessionPreference" DEFAULT 'REMEMBER'::public."SessionPreference" NOT NULL
);


ALTER TABLE public."User" OWNER TO admin;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO admin;

--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Event" (id, title, description, "startDate", "endDate", type, "allDay", "outlookId", "ownerId", "createdAt", "updatedAt", "erpJiraKey", "erpProject", "erpResolver", "erpSourceId", "erpSystems", "erpType", "isErpEvent") FROM stdin;
cmlovptmv0001m0mhjj31jis8	Silvestr	\N	2026-12-30 23:00:00	2026-12-31 23:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhPAAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.292	2026-02-16 07:55:00.292	\N	\N	\N	\N	\N	\N	f
cmlovptp00003m0mhwoc2b5cd	Svátek sv. Štěpána	\N	2026-12-25 23:00:00	2026-12-26 23:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhRXAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.372	2026-02-16 07:55:00.372	\N	\N	\N	\N	\N	\N	f
cmlovptpz0005m0mh3dpims5l	1. svátek vánoční	\N	2026-12-24 23:00:00	2026-12-25 23:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhRMAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.407	2026-02-16 07:55:00.407	\N	\N	\N	\N	\N	\N	f
cmlovptrn0007m0mhixdc1cbj	Štědrý den	\N	2026-12-23 23:00:00	2026-12-24 23:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhRBAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.468	2026-02-16 07:55:00.468	\N	\N	\N	\N	\N	\N	f
cmlovptsm0009m0mhwdlsu2gb	Den boje studentů za svobodu a demokracii	\N	2026-11-16 23:00:00	2026-11-17 23:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhPWAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.502	2026-02-16 07:55:00.502	\N	\N	\N	\N	\N	\N	f
cmlovpttk000bm0mhsepf5pr2	Vznik samostatného Československa (1918)	\N	2026-10-27 23:00:00	2026-10-28 23:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhQYAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.537	2026-02-16 07:55:00.537	\N	\N	\N	\N	\N	\N	f
cmlovptul000dm0mhnjoxzz2o	Den české státnosti	\N	2026-09-27 22:00:00	2026-09-28 22:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhPhAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.573	2026-02-16 07:55:00.573	\N	\N	\N	\N	\N	\N	f
cmlovptvr000fm0mhiq77y8rk	Den upálení mistra Jana Husa	\N	2026-07-05 22:00:00	2026-07-06 22:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhQNAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.616	2026-02-16 07:55:00.616	\N	\N	\N	\N	\N	\N	f
cmlovptwt000hm0mhe0fpiu7w	Cyril a Metoděj	\N	2026-07-04 22:00:00	2026-07-05 22:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhPLAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.653	2026-02-16 07:55:00.653	\N	\N	\N	\N	\N	\N	f
cmlovptxu000jm0mhmcx6b4sv	BPM+DMS workshop	Zdravím všechny\r\n\r\n\r\n\r\nJe tu termín dalšího workshopu k DMS a BPM. Plán je stejný jako vždy – já bych vás rád seznámil s novinkami a pak s vámi diskutoval o tom, co vás k tématu zajímá.\r\n\r\nBudu moc rád, pokud se aktivně zapojíte a podělíte se o svoje zkuš	2026-05-11 05:00:00	2026-05-11 07:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAB-9f-RAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.69	2026-02-16 07:55:00.69	\N	\N	\N	\N	\N	\N	f
cmlovptyx000lm0mhfi1sugdc	Den vítězství	\N	2026-05-07 22:00:00	2026-05-08 22:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhQCAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.729	2026-02-16 07:55:00.729	\N	\N	\N	\N	\N	\N	f
cmlovpu0e000nm0mhowpxekba	Svátek práce	\N	2026-04-30 22:00:00	2026-05-01 22:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhPsAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.782	2026-02-16 07:55:00.782	\N	\N	\N	\N	\N	\N	f
cmlovpu1j000pm0mh0cdh7y86	KARAT Konference SK 2026 (info o termínu a místě)	Zdravím, posílám rezervaci do kalendáře o místě a termínu KK2026 na Slovensku.\r\nPozvánku s registrací obdržíte později.	2026-04-16 05:00:00	2026-04-16 13:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAEFl2dIAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.824	2026-02-16 07:55:00.824	\N	\N	\N	\N	\N	\N	f
cmlovpu2o000rm0mh3wq47cg9	Velikonoční pondělí	\N	2026-04-05 22:00:00	2026-04-06 22:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhQjAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.864	2026-02-16 07:55:00.864	\N	\N	\N	\N	\N	\N	f
cmlovpu3o000tm0mhcchc4kji	Velikonoční neděle	\N	2026-04-04 22:00:00	2026-04-05 22:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhQyAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.9	2026-02-16 07:55:00.9	\N	\N	\N	\N	\N	\N	f
cmlovpu4n000vm0mh2ecr0ty6	Velký pátek	\N	2026-04-02 22:00:00	2026-04-03 22:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1gfTy_AthSYLUEZV3JChkAAAAAhO1AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.936	2026-02-16 07:55:00.936	\N	\N	\N	\N	\N	\N	f
cmlovpu5m000xm0mhm8e2blld	KARAT Konference 2026 (info o termínu a místě)	Zdravím, posílám rezervaci do kalendáře o místě a termínu KK2026.\r\nPozvánku s registrací obdržíte později.	2026-03-26 07:00:00	2026-03-26 15:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAEFl2dHAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:00.971	2026-02-16 07:55:00.971	\N	\N	\N	\N	\N	\N	f
cmlovpu6m000zm0mho81ys55s	Webinář zdarma: Design služeb využívajících LLM AI: vzorce a praktiky	You’re registered for Webinář zdarma: Design služeb využívajících LLM AI: vzorce a praktiky\r\n\r\n\r\nHi Roman,\r\n\r\nYour spot is reserved for this event.\r\n\r\nWebinář zdarma: Design služeb využívajících LLM AI: vzorce a praktiky\r\n\r\nWed, 25 Mar 2026 13:00 - 14:00 	2026-03-25 11:00:00	2026-03-25 12:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAFPEaVIAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.006	2026-02-16 07:55:01.006	\N	\N	\N	\N	\N	\N	f
cmlovpu7q0011m0mh9e2f6klk	Školení E-shopy obecně - princip řešení a vazba na IS KARAT	Dobrý den/ahoj,\r\nrádi bychom vás pozvali na online školení zaměřené na téma E-shopy obecně – princip řešení a vazba na IS KARAT.\r\nCílem školení je srozumitelně představit obecný model fungování e-shopových řešení ve vztahu k IS KARAT, vysvětlit základní p	2026-03-19 07:00:00	2026-03-19 10:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAFPEaVHAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.046	2026-02-16 07:55:01.046	\N	\N	\N	\N	\N	\N	f
cmlovpu9d0013m0mhzb8s5m6t	ITMAN - pracovní pohovor	\N	2026-02-13 11:00:00	2026-02-13 12:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAFAbu4GAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.105	2026-02-16 07:55:01.105	\N	\N	\N	\N	\N	\N	f
cmlovpuab0015m0mh97ng61df	Stavy workflow Jira - import - pokračování	\N	2026-02-11 12:00:00	2026-02-11 13:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAFJx6J3AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.14	2026-02-16 07:55:01.14	\N	\N	\N	\N	\N	\N	f
cmlovpub80017m0mhsu5bir4y	Stavy workflow Jira - import	\N	2026-02-11 10:00:00	2026-02-11 11:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAFJx6J2AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.173	2026-02-16 07:55:01.173	\N	\N	\N	\N	\N	\N	f
cmlovpuc80019m0mhcvruo1xl	WF - Jira	________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit se: https://teams.microsoft.com/meet/37051805297136?p=mO4j4XS8cfRNK2MomQ\r\nID schůzky: 370 518 052 971 36\r\nPřístupový kód: aY79tr7n\r\n___	2026-02-11 06:30:00	2026-02-11 07:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAFGUMrVAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.208	2026-02-16 07:55:01.208	\N	\N	\N	\N	\N	\N	f
cmlovpuda001bm0mhnrdfmx4q	M2C - fakturace	________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit se: https://teams.microsoft.com/meet/34930643761436?p=I71Juivr2q3eGhfilC\r\nID schůzky: 349 306 437 614 36\r\nPřístupový kód: m7be6pW2\r\n___	2026-02-10 12:00:00	2026-02-10 13:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAEwOmC9AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.246	2026-02-16 07:55:01.246	\N	\N	\N	\N	\N	\N	f
cmlovpueb001dm0mh0ke0umtl	Aktivace tokenu - SIGNUMERP-1556	Dobrý den,\r\n\r\ndle domluvy zasílám MS Teams schůzku, kde si společně projdeme aktivaci Tokenu - viz požadavek SIGNUMERP-1556 (https://itmancz.atlassian.net/browse/SIGNUMERP-1556).\r\n\r\nMichala Strnadová\r\n\r\n____________________________________________________	2026-02-09 07:00:00	2026-02-09 08:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAEwOmC8AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.283	2026-02-16 07:55:01.283	\N	\N	\N	\N	\N	\N	f
cmlovpufc001fm0mh21jwhofb	test2	\N	2026-02-06 10:00:00	2026-02-06 10:30:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAEwOmC6AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.32	2026-02-16 07:55:01.32	\N	\N	\N	\N	\N	\N	f
cmlovpugd001hm0mhiyq8dthv	CZ AERO - kickoff projektů 2026	Dobrý den,\r\n\r\nDle dohody posílám aktualizovanou schůzku k projektům CZ AERO.\r\nS pozdravem\r\nRoman Svobodník\r\n\r\n________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit se: https://teams.microsoft	2026-02-06 07:00:00	2026-02-06 08:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAErh5hIAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.358	2026-02-16 07:55:01.358	\N	\N	\N	\N	\N	\N	f
cmlovpuhs001jm0mhhr79yjhb	Aktivace tokenu - SIGNUMERP-1556	Dobrý den,\r\n\r\ndle domluvy zasílám MS Teams schůzku, kde si společně projdeme aktivaci Tokenu - viz požadavek SIGNUMERP-1556 (https://itmancz.atlassian.net/browse/SIGNUMERP-1556).\r\n\r\nMichala Strnadová\r\n\r\n____________________________________________________	2026-02-05 12:00:00	2026-02-05 13:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAEwOmC7AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.408	2026-02-16 07:55:01.408	\N	\N	\N	\N	\N	\N	f
cmlovpuj4001lm0mhg40m27s7	test	\N	2026-02-05 10:30:00	2026-02-05 11:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAEwOmC5AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.457	2026-02-16 07:55:01.457	\N	\N	\N	\N	\N	\N	f
cmlovpuk3001nm0mhwxgbnwkk	ZAMET - koordinační schůzka k servisu	Dobrý den,\r\nDle dohody posílám odkaz na pravidelnou schůzku k servisním požadavkům.\r\nS pozdravem\r\nRoman Svobodník\r\n\r\n________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit se: https://teams.mi	2026-02-03 10:30:00	2026-02-03 11:30:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAELCxI3AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.492	2026-02-16 07:55:01.492	\N	\N	\N	\N	\N	\N	f
cmlovpul3001pm0mhuvzdrcqn	BPM + DMS workshop	Zdravím všechny\r\n\r\n\r\n\r\nJe tu termín dalšího workshopu k DMS a BPM. Plán je stejný jako vždy – já bych vás rád seznámil s novinkami a pak s vámi diskutoval o tom, co vás k tématu zajímá.\r\n\r\nBudu moc rád, pokud se aktivně zapojíte a podělíte se o svoje zkuš	2026-02-03 07:00:00	2026-02-03 09:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAB-9f-QAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.527	2026-02-16 07:55:01.527	\N	\N	\N	\N	\N	\N	f
cmlovpum7001rm0mh8ddxetwu	kadeřnice	\N	2026-01-30 12:00:00	2026-01-30 15:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAETd-ZvAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.568	2026-02-16 07:55:01.568	\N	\N	\N	\N	\N	\N	f
cmlovpunf001tm0mhkhtrmhq1	Školení  - Instalace, nastavení a správa ZASAgenta + modul KAZAS	Pro info. bylo by asi fajn, kdyby na to někdo šel.\r\n\r\nM.\r\n\r\n-----Original Appointment-----\r\nFrom: Simonová Martina - KARAT Software a.s. <Martina.Simonova@karatsoftware.cz>\r\nSent: Friday, January 9, 2026 11:20 AM\r\nTo: Simonová Martina - KARAT Software a.s	2026-01-29 07:00:00	2026-01-29 11:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADTYhkFAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.611	2026-02-16 07:55:01.611	\N	\N	\N	\N	\N	\N	f
cmlovpuod001vm0mhrrw3m647	CZA - Změnové řízení	Ahoj,\r\n\r\nDle dohody zakládám schůzku k tiketu:\r\nhttps://itmancz.atlassian.net/browse/CZAUTOSERP-547\r\nMěli bychom probrat další postup.\r\n\r\nSamozřejmě můžeme se dostat i problematice CAD, resp. k tisku návodky.\r\n\r\nMarek Winkler\r\n\r\n\r\n________________________	2026-01-27 11:00:00	2026-01-27 13:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAD6NxC9AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.645	2026-02-16 07:55:01.645	\N	\N	\N	\N	\N	\N	f
cmlovpupe001xm0mhaeu9xnua	Jira - interní metodika	\N	2026-01-27 07:00:00	2026-01-27 08:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAD6NxC_AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.682	2026-02-16 07:55:01.682	\N	\N	\N	\N	\N	\N	f
cmlovpuqk001zm0mh7hmqcov2	Signum - synchro KSW/ITMAN	________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit: https://teams.microsoft.com/meet/31249871011694?p=BdegsZwQmw4RimfY4q\r\nID schůzky: 312 498 710 116 94\r\nPřístupový kód: XY35kE2V\r\n______	2026-01-26 07:00:00	2026-01-26 07:30:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAD6NxC-AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.724	2026-02-16 07:55:01.724	\N	\N	\N	\N	\N	\N	f
cmlovpurr0021m0mhcoqfu3al	KULSOFT	________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit se: https://teams.microsoft.com/meet/31846798539646?p=0sjTeS74CP8DuehVP9\r\nID schůzky: 318 467 985 396 46\r\nPřístupový kód: hK2LF36Y\r\n___	2026-01-26 07:00:00	2026-01-26 07:30:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADtE1JXAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.768	2026-02-16 07:55:01.768	\N	\N	\N	\N	\N	\N	f
cmlovput00023m0mh1qw61t1a	CZAERO - výkresová dokumentace	Dobrý den,\r\nProsím přizvěte zodpovědné osoby z vaší strany, kolega Lovas v pondělí a úterý nemůže.\r\nDěkuji\r\nR.Svobodník\r\n\r\n________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit se: https://te	2026-01-23 12:00:00	2026-01-23 13:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAAD6NxC8AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.813	2026-02-16 07:55:01.813	\N	\N	\N	\N	\N	\N	f
cmlovpuvq0025m0mhcxzc2a2b	Kyriba - payment file test through SFTP	________________________________\r\nOd: Andrea KRAJCOVA <andrea.krajcova@atalianworld.com>\r\nOdesláno: úterý 20. ledna 2026 14:41:06 (UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague\r\nKomu: Andrea KRAJCOVA <andrea.krajcova@atalianworld.com>; is	2026-01-23 08:30:00	2026-01-23 09:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADkjLU6AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:01.91	2026-02-16 07:55:01.91	\N	\N	\N	\N	\N	\N	f
cmlovpuyb0027m0mhwwbc95wk	Kulsoft - fakturace	________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit se: https://teams.microsoft.com/meet/34273261247426?p=AZ9MyTbOglk3TCcc4O\r\nID schůzky: 342 732 612 474 26\r\nPřístupový kód: XX7sh7Pg\r\n___	2026-01-21 11:30:00	2026-01-21 12:30:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADkjLU4AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:02.004	2026-02-16 07:55:02.004	\N	\N	\N	\N	\N	\N	f
cmlovpuzl0029m0mh5mqw7kis	M2C -  KARAT	________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit se: https://teams.microsoft.com/meet/3685088589907?p=zEnfvRkIBB9XI5Fk8c\r\nID schůzky: 368 508 858 990 7\r\nPřístupový kód: 2pV3o6zT\r\n_____	2026-01-21 07:30:00	2026-01-21 08:30:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADkjLU7AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:02.049	2026-02-16 07:55:02.049	\N	\N	\N	\N	\N	\N	f
cmlovpv0n002bm0mhsommex5w	SVPRO	________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit se: https://teams.microsoft.com/meet/34921551838555?p=85oE6JlrRXhoKzDdiC\r\nID schůzky: 349 215 518 385 55\r\nPřístupový kód: Xy7RL39Z\r\n___	2026-01-20 11:30:00	2026-01-20 12:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADkjLU5AAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:02.088	2026-02-16 07:55:02.088	\N	\N	\N	\N	\N	\N	f
cmlovpv1m002dm0mhn9542r79	Využití dat z interního Karatu	________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit: https://teams.microsoft.com/meet/31261638884022?p=56cKv6y3hVSFrL3km3\r\nID schůzky: 312 616 388 840 22\r\nPřístupový kód: Xh9ut7DK\r\n______	2026-01-16 06:30:00	2026-01-16 07:30:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADW4AEgAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:02.122	2026-02-16 07:55:02.122	\N	\N	\N	\N	\N	\N	f
cmlovpv30002fm0mhu6bmhht1	Karat - koordinační schůzka	________________________________________________________________________________\r\nMicrosoft Teams Potřebujete pomoc?\r\nPřipojit se ke schůzce hned\r\nID schůzky: 318 184 000 787 3\r\nPřístupový kód: hz3fS9nU\r\n________________________________\r\nPro organizátor	2026-01-15 11:00:00	2026-01-15 12:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADOHT5SAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:02.173	2026-02-16 07:55:02.173	\N	\N	\N	\N	\N	\N	f
cmlovpv4c002hm0mh12taschh	FBO One//Adam&Radu Onsite Visit	FBO One API Introduction\r\nBAH/Karat - current workflow description (Vaclav)\r\nExports/Orders/Invoices\r\nMaster Data Clients//Airports//Aircrafts	2026-01-15 06:00:00	2026-01-16 14:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADHkzMwAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:02.22	2026-02-16 07:55:02.22	\N	\N	\N	\N	\N	\N	f
cmlovpv5p002jm0mhognp2ed7	ABS - návštěva	________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit: https://teams.microsoft.com/meet/34906194758677?p=BSGvlckSnCklACP94v\r\nID schůzky: 349 061 947 586 77\r\nPřístupový kód: Am2TZ7F4\r\n______	2026-01-14 23:00:00	2026-01-15 23:00:00	MEETING	t	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADTYhkEAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:02.269	2026-02-16 07:55:02.269	\N	\N	\N	\N	\N	\N	f
cmlovpv6t002lm0mh2k841uh4	Karat	________________________________________________________________________________\r\nMicrosoft Teams Potřebujete pomoc?\r\nPřipojit se ke schůzce hned\r\nID schůzky: 322 222 924 005 75\r\nPřístupový kód: ai7oH2EB\r\n________________________________\r\nPro organizáto	2026-01-14 09:00:00	2026-01-14 09:30:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADW4AEfAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:02.31	2026-02-16 07:55:02.31	\N	\N	\N	\N	\N	\N	f
cmlovpv82002nm0mhwz235l2h	Přenosy zakázek z Elzy do ISK pro rok 2026	Dobrý den,\r\n\r\ndle domluvy v požadavku FALSEC-344 zasílám odkaz na schůzku, kde si projdeme proces zakládání zakázek.\r\n\r\nMichala Strnadová\r\n\r\nhttps://itmancz.atlassian.net/browse/FALSEC-344\r\n\r\n_______________________________________________________________	2026-01-12 11:00:00	2026-01-12 12:00:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADVGAUkAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:02.354	2026-02-16 07:55:02.354	\N	\N	\N	\N	\N	\N	f
cmlovpv9i002pm0mh7pgpenqr	Servis - refresh	Servisní refresh	2026-01-12 11:00:00	2026-01-12 11:15:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADTYhkGAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:02.406	2026-02-16 07:55:02.406	\N	\N	\N	\N	\N	\N	f
cmlovpvaq002rm0mh9kmy2y7u	STANDA	Krátký update stavu otevřených věcí\r\n\r\n________________________________________________________________________________\r\nSchůzka v Microsoft Teams\r\nPřipojit: https://teams.microsoft.com/meet/35760350054306?p=puLIVlZ9zPLqW0ZEIf\r\nID schůzky: 357 603 500 543	2026-01-12 06:00:00	2026-01-12 06:15:00	MEETING	f	AAMkAGE2M2M5NjQ0LTMyOWYtNDk0Yi05NzliLTAwZjI0ODRhYWU5MQBGAAAAAACvkvM-VJkKTJ3ePivVJTMfBwB1gfTy_AthSYLUEZV3JChkAAAAAAENAAB1C0sq0fnWQKrZoQGLpq9tAADTYhkHAAA=	cmljhb3rd00002h69vmz54r7h	2026-02-16 07:55:02.45	2026-02-16 07:55:02.45	\N	\N	\N	\N	\N	\N	f
\.


--
-- Data for Name: Page; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Page" (id, slug, title, "createdAt", "updatedAt") FROM stdin;
cmlgcp29u0001g5whacn3sobk	dashboard	Dashboard	2026-02-10 08:40:22.722	2026-02-10 08:40:22.722
cmlgcp2a60002g5whygmvt6os	projekty	Projekty	2026-02-10 08:40:22.735	2026-02-10 08:40:22.735
cmlgcp2ab0003g5wh5opdw7kc	users	Uživatelé	2026-02-10 08:40:22.74	2026-02-10 08:40:22.74
\.


--
-- Data for Name: PageComponent; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."PageComponent" (id, "pageId", type, "order", "contentConfig", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."RolePermission" (id, role, permission, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."User" (id, email, name, password, "externalId", "authProvider", image, role, "isActive", "createdAt", "updatedAt", "rememberLogin", "sessionPreference") FROM stdin;
cmlgcp29j0000g5whigs2ylha	admin@firma.cz	Admin	$2a$12$NudJhFMXI4wJl/S1p8le8OIrbLErb7chowTUHGeKiuR1HpG.nMj2e	\N	LOCAL	\N	ADMIN	t	2026-02-10 08:40:22.71	2026-02-11 11:00:17.652	t	REMEMBER
cmljkwqga002soel8zkrm6ouq	vojtech.kratochvil@itman.cz	Vojtěch Kratochvíl - ITMAN Czech, s.r.o.	\N	3885d51f-dd60-4659-a49c-c431a8bf9c7b	AZURE_AD	\N	USER	t	2026-02-12 14:53:36.105	2026-02-13 09:39:36.901	t	REMEMBER
cmljhb3rd00002h69vmz54r7h	Roman.Svobodnik@itman.cz	Roman Svobodník - ITMAN Czech, s.r.o.	\N	81a0f05e-3fdf-41f4-94c2-11a8cf7e6d77	AZURE_AD	\N	USER	t	2026-02-12 13:12:48.071	2026-02-16 12:39:37.506	t	REMEMBER
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f79c318b-a08a-4cce-ab3c-3bde39c02eb9	bc2575646312bfb41b49690a81cf30dc612200bf17c5956837b1e9fdd27495fb	2026-02-10 08:40:19.751523+00	20260210084019_add_it_role_and_permissions	\N	\N	2026-02-10 08:40:19.638872+00	1
48895e28-0084-43af-8162-ef93d3ea7d75	588cca660adb9cbde31543c466a71bdbceef120780792f367a60948ba502ea56	2026-02-11 08:46:10.391745+00	20260211084610_add_erp_fields	\N	\N	2026-02-11 08:46:10.355821+00	1
\.


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: PageComponent PageComponent_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."PageComponent"
    ADD CONSTRAINT "PageComponent_pkey" PRIMARY KEY (id);


--
-- Name: Page Page_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Page"
    ADD CONSTRAINT "Page_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Event_isErpEvent_erpSourceId_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Event_isErpEvent_erpSourceId_idx" ON public."Event" USING btree ("isErpEvent", "erpSourceId");


--
-- Name: Event_ownerId_startDate_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Event_ownerId_startDate_idx" ON public."Event" USING btree ("ownerId", "startDate");


--
-- Name: Event_type_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Event_type_idx" ON public."Event" USING btree (type);


--
-- Name: PageComponent_pageId_order_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "PageComponent_pageId_order_idx" ON public."PageComponent" USING btree ("pageId", "order");


--
-- Name: Page_slug_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Page_slug_key" ON public."Page" USING btree (slug);


--
-- Name: RolePermission_role_permission_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "RolePermission_role_permission_key" ON public."RolePermission" USING btree (role, permission);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_externalId_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "User_externalId_key" ON public."User" USING btree ("externalId");


--
-- Name: Event Event_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PageComponent PageComponent_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."PageComponent"
    ADD CONSTRAINT "PageComponent_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES public."Page"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 7Vg5iWvE5Rk580coW99GInP5iqZTWhEp2I9CgfMyVLSupbqDjMH4OsePW6dO0i3

