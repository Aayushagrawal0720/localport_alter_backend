--
-- PostgreSQL database dump
--

-- Dumped from database version 13.4 (Ubuntu 13.4-0ubuntu0.21.04.1)
-- Dumped by pg_dump version 13.4 (Ubuntu 13.4-0ubuntu0.21.04.1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    oid text,
    key text,
    value text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    uid text,
    key text,
    value text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (oid, key, value) FROM stdin;
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	uid	user1
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	pickuploc	Katanga
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	pickupadd	h no 123
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	pickuplatlong	{12,23}
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	pickupname	Nikhil
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	pickupphone	111111111111
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	droploc	Katanga
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	dropadd	h no 345
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	droplatlong	{12,23}
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	dropname	Aayush
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	dropphone	098765432111
1e1279e7-21e9-4283-9cb1-50e88a5c6bf3	status	Pending
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (uid, key, value) FROM stdin;
user13	fname	First name 10
user13	lname	Last name 10
user13	mobile	911234567890
user1	fname	Nikhil
user1	lname	Soni
user1	mobile	917000295548
user13	usertype	vendor
user1	usertype	vendor
user2	fname	Aayush
user2	lname	Agrawal
user2	mobile	91987654321
user2	usertype	individual
\.


--
-- PostgreSQL database dump complete
--

