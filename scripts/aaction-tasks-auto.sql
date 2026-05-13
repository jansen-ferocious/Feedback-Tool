-- Run this in Supabase SQL Editor
-- This will automatically find the AAction Air project, delete existing tasks, and insert all tasks with location prefixes

DO $$
DECLARE
  proj_id UUID;
BEGIN
  -- Find the AAction Air project
  SELECT id INTO proj_id FROM projects WHERE name ILIKE '%aaction%' LIMIT 1;

  IF proj_id IS NULL THEN
    RAISE EXCEPTION 'Could not find AAction Air project';
  END IF;

  -- Delete existing tasks for this project
  DELETE FROM project_tasks WHERE project_id = proj_id;

  -- SAVANNAH Pre-Launch: Sitewide Find-and-Replace
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - Remove all NATE references — both NATE and N.A.T.E. patterns across 12 confirmed pages. Replace with "factory-trained" / "manufacturer-certified."', 'not_started', 1),
    (proj_id, 'SAVANNAH - Replace 24/7 phone availability language sitewide. Standardize to: "Phones answered live 8 a.m. to 10 p.m., seven days a week. After-hours messages returned first thing the next morning."', 'not_started', 2),
    (proj_id, 'SAVANNAH - Standardize age references to "more than 25 years" (or "over 25 years"). Home page "over 26 years" is the outlier.', 'not_started', 3),
    (proj_id, 'SAVANNAH - Remove all Bryant references — 97 total mentions across 6 pages. Three pages being unpublished, three service area pages need surgical edits.', 'not_started', 4),
    (proj_id, 'SAVANNAH - Fix "Altanta, GA" typo in footer location switcher → "Atlanta, GA"', 'not_started', 5),
    (proj_id, 'SAVANNAH - Fix "Isle Hope" → "Isle of Hope" in service area lists (Home, Contact)', 'not_started', 6),
    (proj_id, 'SAVANNAH - Home page H1: fix inconsistent capitalization. Use title case: "The Friendly Local Home Comfort Experts"', 'not_started', 7),
    (proj_id, 'SAVANNAH - Add country code to all tel: links. tel:912-897-2247 → tel:+19128972247', 'not_started', 8);

  -- SAVANNAH Pre-Launch: Global Block & Template Changes
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - Replace the three existing promo cards with approved cards: $89 Pre-Summer AC Inspection, $1,500 Heroes Discount, Free First Year of PSP.', 'not_started', 9),
    (proj_id, 'SAVANNAH - Remove "American Home Shield Warranty" menu item from main nav, mobile nav, and footer nav.', 'not_started', 10),
    (proj_id, 'SAVANNAH - Rebuild or remove the "Where We Serve" panel global block — currently shows inaccurate city list with duplicates.', 'not_started', 11);

  -- SAVANNAH Pre-Launch: Specific Page Edits
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - Membership Plan page: correct pricing to $195 / $175 / $175 / $125.', 'not_started', 12),
    (proj_id, 'SAVANNAH - Financing page: rewrite to lead with Service Finance Company as primary partner (rates as low as 6.99% APR, up to 18 months same-as-cash).', 'not_started', 13),
    (proj_id, 'SAVANNAH - Pooler page: replace "South Georgia" with "Coastal Georgia" (two instances).', 'not_started', 14),
    (proj_id, 'SAVANNAH - Home + About pages: replace "Join 2,500+ Happy Customers" with "Trusted by your neighbors for more than 25 years."', 'not_started', 15),
    (proj_id, 'SAVANNAH - Port Wentworth page: (1) Fill or remove three empty H3 sections. (2) De-duplicate the doubled "Professional Installation Process" list.', 'not_started', 16),
    (proj_id, 'SAVANNAH - Add OAC (On Approved Credit) disclaimer wherever the site references financing rates or offers of credit.', 'not_started', 17);

  -- SAVANNAH Pre-Launch: Internal Links Audit
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - Grep every href pointing to staging URL and verify path starts with /savannah/. Broken patterns on 28 of 37 pages.', 'not_started', 18),
    (proj_id, 'SAVANNAH - Repath /contact/ → /savannah/contact/ across ~26 pages', 'not_started', 19),
    (proj_id, 'SAVANNAH - Repath /about/ → /savannah/about/ across ~6 pages', 'not_started', 20),
    (proj_id, 'SAVANNAH - Verify /about/advantage-plan/ URL exists. If not, repath to /savannah/about/maintenance-plans/', 'not_started', 21),
    (proj_id, 'SAVANNAH - Fix wrong taxonomy paths: /other-services/ductwork, /other-services/zone-control-systems → correct paths', 'not_started', 22),
    (proj_id, 'SAVANNAH - Repath /heating, /heating/furnaces, /heating/heat-pumps → add /savannah/ prefix', 'not_started', 23),
    (proj_id, 'SAVANNAH - Fix wrong path: /indoor-air-quality → IAQ lives at /ductwork-air-quality/', 'not_started', 24),
    (proj_id, 'SAVANNAH - Repath /maintenance-plans and /air-conditioning/ductless-mini-splits → add /savannah/', 'not_started', 25);

  -- SAVANNAH Pre-Launch: Outbound Link Removal
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - Bloomingdale: remove natex.org outbound link', 'not_started', 26),
    (proj_id, 'SAVANNAH - Bluffton: remove palmettobluff.com outbound link', 'not_started', 27),
    (proj_id, 'SAVANNAH - Hilton Head: remove seapines.com outbound link', 'not_started', 28),
    (proj_id, 'SAVANNAH - Pooler: remove tanger.com outbound link', 'not_started', 29),
    (proj_id, 'SAVANNAH - Rincon: remove forecast.weather.gov + natex.org outbound links', 'not_started', 30),
    (proj_id, 'SAVANNAH - Skidaway: remove gastateparks.org outbound link', 'not_started', 31),
    (proj_id, 'SAVANNAH - Tybee: remove visittybee.com outbound link', 'not_started', 32),
    (proj_id, 'SAVANNAH - Whitemarsh: remove weather.com outbound link', 'not_started', 33),
    (proj_id, 'SAVANNAH - Financing page: verify optimusfinancing.com link appropriateness given Service Finance is primary.', 'not_started', 34);

  -- SAVANNAH Pre-Launch: Service Area List Reconciliation
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - Trim homepage service area list to 11 cities with existing pages: Bloomingdale, Bluffton, Hilton Head, Pooler, Port Wentworth, Richmond Hill, Rincon, Skidaway, Tybee, Whitemarsh, Wilmington.', 'not_started', 35),
    (proj_id, 'SAVANNAH - Remove from homepage list (no pages exist): Hardeeville, Savannah, Garden City, Georgetown, Guyton, Isle of Hope.', 'not_started', 36);

  -- SAVANNAH Pre-Launch: Pages to Unpublish
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - Unpublish Property Management HVAC (/ductwork-air-quality/property-management-hvac/) — multiple factual errors', 'not_started', 37),
    (proj_id, 'SAVANNAH - Unpublish Bryant ERV Installation (/ductwork-air-quality/energy-recovery-ventilator-erv/) — 68 Bryant mentions', 'not_started', 38),
    (proj_id, 'SAVANNAH - Unpublish Zone Control Systems (/ductwork-air-quality/zone-control-systems/) — 10 Bryant mentions', 'not_started', 39),
    (proj_id, 'SAVANNAH - Unpublish Dual Fuel Hybrid Systems (/dual-fuel-hybrid-systems/) — 12 Bryant mentions', 'not_started', 40),
    (proj_id, 'SAVANNAH - Unpublish American Home Shield Warranty (/american-home-shield/) — partnership discontinued', 'not_started', 41);

  -- SAVANNAH Pre-Launch: Schema & Metadata
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - Propose schema naming convention for JSON-LD Organization/WebSite and og:site_name. Maintain NAP consistency.', 'not_started', 42),
    (proj_id, 'SAVANNAH - JSON-LD: change Person author "ferociousmedia" → "AAction Air" on service pages.', 'not_started', 43),
    (proj_id, 'SAVANNAH - Set og:type on homepage to "website". Service pages can stay "article".', 'not_started', 44),
    (proj_id, 'SAVANNAH - Build complete BreadcrumbList chains: Home → Section → Page.', 'not_started', 45),
    (proj_id, 'SAVANNAH - Add full LocalBusiness/HVACBusiness schema with address, phone, hours, areaServed, licenses.', 'not_started', 46),
    (proj_id, 'SAVANNAH - Premier Service Plan page: update title tag and meta description per spec.', 'not_started', 47);

  -- SAVANNAH Pre-Launch: Appendix D Surgical Edit Packs
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - Appendix D.1 — Skidaway Island: Bryant, NATE, marine HVAC, solar removal, energy audit, 24/7, broken link', 'not_started', 48),
    (proj_id, 'SAVANNAH - Appendix D.2 — Wilmington Island: Bryant, NATE, 24/7/365, solar removal, broken link', 'not_started', 49),
    (proj_id, 'SAVANNAH - Appendix D.3 — Whitemarsh Island: Bryant, NATE, 24/7, SC-geography fix, energy audit, solar, weather.com link', 'not_started', 50),
    (proj_id, 'SAVANNAH - Appendix D.4 — Bloomingdale: NATE (×2), 24/7, solar removal, natex.org link, broken link', 'not_started', 51),
    (proj_id, 'SAVANNAH - Appendix D.5 — Richmond Hill: 24/7 (×3+), NATE, energy audit, solar removal', 'not_started', 52),
    (proj_id, 'SAVANNAH - Appendix D.6 — Rincon: "24 hours" variant, NATE, solar, energy audit, weather.gov link, broken link', 'not_started', 53),
    (proj_id, 'SAVANNAH - Appendix D.7 — Hilton Head: broken link, seapines.com outbound link', 'not_started', 54),
    (proj_id, 'SAVANNAH - Appendix D.8 — Bluffton: "isn''t not" typo, broken link, palmettobluff.com link', 'not_started', 55),
    (proj_id, 'SAVANNAH - Appendix D.9 — Tybee Island: "AAction Airfocuses" typo, broken link, visittybee.com link', 'not_started', 56),
    (proj_id, 'SAVANNAH - Appendix D.10 — Commercial HVAC: 2 broken links', 'not_started', 57),
    (proj_id, 'SAVANNAH - Appendix D.11 — Ductless Mini-Split AC: 3 broken links, remove Bryant from brand list', 'not_started', 58),
    (proj_id, 'SAVANNAH - Appendix D.12 — Energy Efficiency: energy audit refs, "Home Performance Testing" removal, "hey/get" typo', 'not_started', 59),
    (proj_id, 'SAVANNAH - Appendix D.13 — Whole-Home Humidifier: N.A.T.E. (×2), 24/7, 5 broken internal links', 'not_started', 60);

  -- SAVANNAH Post-Launch: Quality (30 days)
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - About page full rewrite — use Appendix B copy. Title tag and meta description included.', 'not_started', 61),
    (proj_id, 'SAVANNAH - Premier Service Plan full rewrite — use Appendix C copy. Standardize naming.', 'not_started', 62),
    (proj_id, 'SAVANNAH - AC Installation full rewrite — content brief from James.', 'not_started', 63),
    (proj_id, 'SAVANNAH - Heat Pumps full rewrite — A2L refrigerant transition, Savannah climate fit, Georgia Power rebates. No federal tax credits.', 'not_started', 64),
    (proj_id, 'SAVANNAH - Financing page full rewrite — Service Finance focus, payment examples, scope.', 'not_started', 65),
    (proj_id, 'SAVANNAH - Energy Efficiency full rewrite — what AAction actually offers.', 'not_started', 66),
    (proj_id, 'SAVANNAH - Contact page: add business hours block.', 'not_started', 67),
    (proj_id, 'SAVANNAH - All Gravity Forms: add ZIP code field for service-area eligibility.', 'not_started', 68),
    (proj_id, 'SAVANNAH - Contact form: expand dropdown — add Premier Service Plan, New System Consultation, Other.', 'not_started', 69),
    (proj_id, 'SAVANNAH - Reviews module: filter reviews on service pages to those mentioning the specific service.', 'not_started', 70);

  -- SAVANNAH Post-Launch: Strategic Content Rebuild
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - Component A: Rebuild 11 existing city pages with real landmarks, typical home types, neighborhood-specific HVAC.', 'not_started', 71),
    (proj_id, 'SAVANNAH - Component B: Build 5 new city pages: Garden City, Georgetown, Guyton, Hardeeville, Isle of Hope + Savannah page.', 'not_started', 72),
    (proj_id, 'SAVANNAH - Component C: Build Savannah neighborhood pages — Ardsley Park, Historic District, Victorian District, Starland, etc.', 'not_started', 73),
    (proj_id, 'SAVANNAH - Component D — STR HVAC page (/short-term-rental-hvac/). Strategic priority.', 'not_started', 74),
    (proj_id, 'SAVANNAH - Component D — Property Management HVAC page. MSA structure, dedicated POC.', 'not_started', 75);

  -- Needs Review (Both locations)
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'SAVANNAH - Written remediation plan due May 22 — scope, quality standard, timeline, editorial workflow, pricing.', 'needs_review', 76),
    (proj_id, 'SAVANNAH - Editorial workflow change — no content goes draft → staged until James reviews.', 'needs_review', 77),
    (proj_id, 'ATLANTA - Verify if 470-698-2247 is a tracking number before any swap.', 'needs_review', 78),
    (proj_id, 'ATLANTA - Insert PSP artwork for "Club Membership PAYS$" when John provides it.', 'needs_review', 79);

  -- ATLANTA Pre-Launch: Homepage
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'ATLANTA - Replace "Your satisfaction is our goal" picture with Atlanta staff photo.', 'not_started', 80),
    (proj_id, 'ATLANTA - Drop the people picture below the property picture.', 'not_started', 81),
    (proj_id, 'ATLANTA - Update Trust Badges — add CAAG, Greystone, Ruud, American Standard, AprilAire, Honeywell. Remove Bryant badge.', 'not_started', 82),
    (proj_id, 'ATLANTA - Add SC Mechanical Contractors number to footer.', 'not_started', 83),
    (proj_id, 'ATLANTA - Add "American Standard – Co-Op Approved" badge to homepage.', 'not_started', 84);

  -- ATLANTA Pre-Launch: PSP Section
  INSERT INTO project_tasks (project_id, content, status, position) VALUES
    (proj_id, 'ATLANTA - PSP: Add language: "Customer will receive a computer analysis report of their system on each visit."', 'not_started', 85),
    (proj_id, 'ATLANTA - PSP Benefits (A): change "two year warranty on replacements" → 10 year labor warranty', 'not_started', 86),
    (proj_id, 'ATLANTA - PSP Benefits (C): change "one year warranty on repairs" → two year warranty', 'not_started', 87),
    (proj_id, 'ATLANTA - PSP Benefits (D): remove extended warranties; add one free diagnostic per plan', 'not_started', 88),
    (proj_id, 'ATLANTA - PSP Benefits (E): combine "10% discount on replacement and accessories"', 'not_started', 89),
    (proj_id, 'ATLANTA - PSP Benefits (F): add additional system discounts on service plan', 'not_started', 90),
    (proj_id, 'ATLANTA - PSP: Fix broken "Join Today" button link', 'not_started', 91),
    (proj_id, 'ATLANTA - PSP: Update pricing: 2026 ONLY $99.00 per plan per property (unlimited systems)', 'not_started', 92),
    (proj_id, 'ATLANTA - PSP: Fix "Learn More" button flow — forms aren''t working', 'not_started', 93),
    (proj_id, 'ATLANTA - PSP: Fix "Join Today" tab (currently not working)', 'not_started', 94);

  RAISE NOTICE 'Successfully imported 94 tasks for project: %', proj_id;
END $$;
