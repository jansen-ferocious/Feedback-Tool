-- Run this in Supabase SQL Editor
-- First, find your AAction Air project ID and replace PROJECT_ID_HERE

-- To find your project ID, run:
-- SELECT id, name FROM projects WHERE name ILIKE '%aaction%';

-- Then insert the tasks (replace PROJECT_ID_HERE with actual UUID):

INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Remove all NATE references — both NATE and N.A.T.E. patterns across 12 confirmed pages. Replace with ''factory-trained'' / ''manufacturer-certified.''', 'pre_launch', 0);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Replace 24/7 phone availability language sitewide. Standardize to: ''Phones answered live 8 a.m. to 10 p.m., seven days a week.''', 'pre_launch', 1);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Standardize age references to ''more than 25 years''. Home page ''over 26 years'' is the outlier.', 'pre_launch', 2);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Remove all Bryant references — 97 total mentions across 6 pages.', 'pre_launch', 3);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Fix ''Altanta, GA'' typo in footer location switcher → ''Atlanta, GA''', 'pre_launch', 4);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Fix ''Isle Hope'' → ''Isle of Hope'' in service area lists', 'pre_launch', 5);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Home page H1: fix inconsistent capitalization. Use title case.', 'pre_launch', 6);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Add country code to all tel: links. tel:912-897-2247 → tel:+19128972247', 'pre_launch', 7);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Replace promo cards with approved cards: $89 Pre-Summer AC Inspection, $1,500 Heroes Discount, Free First Year of PSP.', 'pre_launch', 8);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Remove ''American Home Shield Warranty'' menu item from main nav, mobile nav, and footer nav.', 'pre_launch', 9);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Rebuild or remove the ''Where We Serve'' panel global block.', 'pre_launch', 10);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Membership Plan page: correct pricing to $195 / $175 / $175 / $125.', 'pre_launch', 11);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Financing page: rewrite to lead with Service Finance Company as primary partner.', 'pre_launch', 12);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Pooler page: replace ''South Georgia'' with ''Coastal Georgia''.', 'pre_launch', 13);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Replace ''Join 2,500+ Happy Customers'' with ''Trusted by your neighbors for more than 25 years.''', 'pre_launch', 14);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Port Wentworth page: Fill or remove three empty H3 sections. De-duplicate lists.', 'pre_launch', 15);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Add OAC (On Approved Credit) disclaimer for all financing references.', 'pre_launch', 16);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Audit all internal links - repath /contact/ → /savannah/contact/ across ~26 pages.', 'pre_launch', 17);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Repath /about/ → /savannah/about/ across ~6 pages.', 'pre_launch', 18);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Remove outbound links: natex.org, palmettobluff.com, seapines.com, tanger.com, weather.gov, gastateparks.org, visittybee.com, weather.com.', 'pre_launch', 19);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Trim homepage service area list to the 11 cities with existing pages.', 'pre_launch', 20);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Unpublish Property Management HVAC, Bryant ERV, Zone Control Systems, Dual Fuel Hybrid, American Home Shield pages.', 'pre_launch', 21);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Fix JSON-LD schema: update author, add LocalBusiness schema, build BreadcrumbList chains.', 'pre_launch', 22);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Appendix D surgical edits for: Skidaway, Wilmington, Whitemarsh, Bloomingdale, Richmond Hill, Rincon islands.', 'pre_launch', 23);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Appendix D surgical edits for: Hilton Head, Bluffton, Tybee Island, Commercial HVAC, Mini-Split, Energy Efficiency, Humidifier pages.', 'pre_launch', 24);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'About page full rewrite — use Appendix B copy.', 'post_launch', 25);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Premier Service Plan full rewrite — use Appendix C copy.', 'post_launch', 26);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'AC Installation full rewrite — content brief from James.', 'post_launch', 27);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Heat Pumps full rewrite — A2L refrigerant, Savannah climate fit, Georgia Power rebates.', 'post_launch', 28);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Financing page full rewrite — Service Finance focus, payment examples.', 'post_launch', 29);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Energy Efficiency full rewrite — what AAction actually offers.', 'post_launch', 30);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Contact page: add business hours block.', 'post_launch', 31);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'All Gravity Forms: add ZIP code field for service-area eligibility.', 'post_launch', 32);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Contact form: expand service dropdown options.', 'post_launch', 33);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Reviews module: filter reviews on service pages to specific services.', 'post_launch', 34);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Component A: Rebuild 11 existing city pages with real landmarks.', 'post_launch', 35);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Component B: Build 5 new city pages + Savannah service area page.', 'post_launch', 36);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Component C: Build Savannah neighborhood pages for long-tail SEO.', 'post_launch', 37);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Component D: STR HVAC page (/short-term-rental-hvac/).', 'post_launch', 38);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Component D: Property Management HVAC page.', 'post_launch', 39);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Written remediation plan due May 22 — scope, quality, timeline, workflow, pricing.', 'needs_review', 40);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Editorial workflow change — all content needs James review before staging.', 'needs_review', 41);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Atlanta: Verify if 470-698-2247 is a tracking number before any swap.', 'needs_review', 42);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Atlanta: Insert PSP artwork for ''Club Membership PAYS$'' when John provides it.', 'needs_review', 43);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Atlanta: Replace staff picture, update trust badges, add SC license to footer.', 'pre_launch', 44);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Atlanta: Add ''American Standard – Co-Op Approved'' badge to homepage.', 'pre_launch', 45);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Atlanta PSP: Add computer analysis report language.', 'pre_launch', 46);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Atlanta PSP: Update warranty terms - 10yr labor, 2yr repairs, 1 free diagnostic.', 'pre_launch', 47);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Atlanta PSP: Update pricing to 2026 $99.00 per plan per property.', 'pre_launch', 48);
INSERT INTO project_tasks (project_id, content, status, position) VALUES ('PROJECT_ID_HERE', 'Atlanta PSP: Fix broken ''Join Today'' and ''Learn More'' buttons.', 'pre_launch', 49);
