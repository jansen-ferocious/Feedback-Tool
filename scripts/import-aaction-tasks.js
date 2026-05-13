// Run this script with: node scripts/import-aaction-tasks.js
// Make sure to set your Supabase credentials

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// You'll need to set these or use environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Tasks extracted from the HTML file
const tasks = [
  // Savannah — Sitewide Find-and-Replace (Pre-Launch)
  { content: "Remove all NATE references — both NATE and N.A.T.E. patterns across 12 confirmed pages. Replace with 'factory-trained' / 'manufacturer-certified.' Grep both patterns to confirm zero remaining instances.", status: "pre_launch" },
  { content: "Replace 24/7 phone availability language sitewide (18 confirmed pages, 2 template surfaces + body copy). Standardize to: 'Phones answered live 8 a.m. to 10 p.m., seven days a week. After-hours messages returned first thing the next morning.'", status: "pre_launch" },
  { content: "Standardize age references to 'more than 25 years' (or 'over 25 years' — pick one and use consistently). Home page 'over 26 years' is the outlier to bring down.", status: "pre_launch" },
  { content: "Remove all Bryant references — 97 total mentions across 6 pages. Three full pages (Bryant ERV, Zone Control, Dual Fuel) are being unpublished. Three service area pages (Skidaway, Whitemarsh, Wilmington) need surgical edits per Appendix D.", status: "pre_launch" },
  { content: "Fix 'Altanta, GA' typo in footer location switcher → 'Atlanta, GA'", status: "pre_launch" },
  { content: "Fix 'Isle Hope' → 'Isle of Hope' in service area lists (Home, Contact)", status: "pre_launch" },
  { content: "Home page H1: fix inconsistent capitalization. Use title case: 'The Friendly Local Home Comfort Experts'", status: "pre_launch" },
  { content: "Add country code to all tel: links. tel:912-897-2247 → tel:+19128972247", status: "pre_launch" },

  // Savannah — Global Block & Template Changes (Pre-Launch)
  { content: "Replace the three existing promo cards in the global block on 8 confirmed pages with the three approved cards: $89 Pre-Summer AC Inspection, $1,500 Heroes Discount, Free First Year of PSP.", status: "pre_launch" },
  { content: "Remove 'American Home Shield Warranty' menu item from main nav, mobile nav, and footer nav.", status: "pre_launch" },
  { content: "Rebuild or remove the 'Where We Serve' panel global block. Currently shows fixed 5-6 city list that doesn't match the page it appears on.", status: "pre_launch" },

  // Savannah — Specific Page Edits (Pre-Launch)
  { content: "Membership Plan page: correct pricing to $195 / $175 / $175 / $125 (first central / each additional central / single zone mini-split / each additional head).", status: "pre_launch" },
  { content: "Financing page: rewrite to lead with Service Finance Company as primary partner (rates as low as 6.99% APR, up to 18 months same-as-cash). OPTIMUS as secondary.", status: "pre_launch" },
  { content: "Pooler page: replace 'South Georgia' with 'Coastal Georgia' (two instances).", status: "pre_launch" },
  { content: "Home + About pages: replace 'Join 2,500+ Happy Customers' with 'Trusted by your neighbors for more than 25 years.'", status: "pre_launch" },
  { content: "Port Wentworth page: (1) Fill or remove three empty H3 sections. (2) De-duplicate the doubled 'Professional Installation Process' list.", status: "pre_launch" },
  { content: "Add OAC (On Approved Credit) disclaimer wherever the site references financing rates, monthly payment examples, or offers of credit.", status: "pre_launch" },

  // Savannah — Internal Links Audit (Pre-Launch)
  { content: "Grep every href pointing to aactionair.tempurl.host/ and verify path starts with /savannah/ (or another valid branch prefix).", status: "pre_launch" },
  { content: "Repath /contact/ → /savannah/contact/ across ~26 pages", status: "pre_launch" },
  { content: "Repath /about/ → /savannah/about/ across ~6 pages", status: "pre_launch" },
  { content: "Verify /about/advantage-plan/ URL exists. If not, repath to /savannah/about/maintenance-plans/", status: "pre_launch" },
  { content: "Fix wrong taxonomy paths: /other-services/ductwork, /other-services/zone-control-systems → correct paths", status: "pre_launch" },
  { content: "Repath /heating, /heating/furnaces, /heating/heat-pumps → add /savannah/ prefix", status: "pre_launch" },
  { content: "Fix wrong path: /indoor-air-quality, /indoor-air-quality/air-filtration → IAQ lives at /ductwork-air-quality/", status: "pre_launch" },
  { content: "Repath /maintenance-plans → add /savannah/", status: "pre_launch" },
  { content: "Repath /air-conditioning/ductless-mini-splits → add /savannah/", status: "pre_launch" },

  // Savannah — Outbound Link Removal (Pre-Launch)
  { content: "Bloomingdale: remove natex.org outbound link", status: "pre_launch" },
  { content: "Bluffton: remove palmettobluff.com outbound link", status: "pre_launch" },
  { content: "Hilton Head: remove seapines.com outbound link", status: "pre_launch" },
  { content: "Pooler: remove tanger.com outbound link", status: "pre_launch" },
  { content: "Rincon: remove forecast.weather.gov + natex.org outbound links", status: "pre_launch" },
  { content: "Skidaway: remove gastateparks.org outbound link", status: "pre_launch" },
  { content: "Tybee: remove visittybee.com outbound link", status: "pre_launch" },
  { content: "Whitemarsh: remove weather.com outbound link", status: "pre_launch" },
  { content: "Financing page: verify optimusfinancing.com link is still appropriate given Service Finance is now primary partner.", status: "pre_launch" },

  // Savannah — Service Area List Reconciliation (Pre-Launch)
  { content: "Trim homepage service area list to the 11 cities with existing pages: Bloomingdale, Bluffton, Hilton Head, Pooler, Port Wentworth, Richmond Hill, Rincon, Skidaway Island, Tybee Island, Whitemarsh Island, Wilmington Island.", status: "pre_launch" },
  { content: "Remove from homepage list (no pages exist): Hardeeville, Savannah, Garden City, Georgetown, Guyton, Isle of Hope. These will be built as Component B of the strategic rebuild.", status: "pre_launch" },

  // Savannah — Pages to Unpublish (Pre-Launch)
  { content: "Unpublish Property Management HVAC (/ductwork-air-quality/property-management-hvac/) — multiple factual errors", status: "pre_launch" },
  { content: "Unpublish Bryant ERV Installation (/ductwork-air-quality/energy-recovery-ventilator-erv/) — 68 Bryant mentions", status: "pre_launch" },
  { content: "Unpublish Zone Control Systems (/ductwork-air-quality/zone-control-systems/) — 10 Bryant mentions", status: "pre_launch" },
  { content: "Unpublish Dual Fuel Hybrid Systems (/dual-fuel-hybrid-systems/) — 12 Bryant mentions", status: "pre_launch" },
  { content: "Unpublish American Home Shield Warranty (/american-home-shield/) — partnership discontinued", status: "pre_launch" },

  // Savannah — Schema & Metadata (Pre-Launch)
  { content: "Propose schema naming convention for JSON-LD Organization name, JSON-LD WebSite name, and og:site_name. Maintain NAP consistency with GBP, Yelp, BBB.", status: "pre_launch" },
  { content: "JSON-LD: remove or change Person author 'ferociousmedia' → 'AAction Air' on service pages.", status: "pre_launch" },
  { content: "Set og:type on homepage to 'website'. Service pages can stay 'article'.", status: "pre_launch" },
  { content: "Build complete BreadcrumbList chains: Home → Section → Page. Currently only contains 'Home.'", status: "pre_launch" },
  { content: "Add full LocalBusiness/HVACBusiness schema: business name, address (6720 Johnny Mercer Blvd, Savannah, GA 31410), tel:+19128972247, geo coordinates, openingHours, areaServed, priceRange, aggregateRating, social sameAs URLs, licenses.", status: "pre_launch" },
  { content: "Premier Service Plan page: update title tag to: 'Premier Service Plan — HVAC Maintenance in Savannah, GA | AAction Air'", status: "pre_launch" },
  { content: "Premier Service Plan page: replace auto-generated meta description with custom copy.", status: "pre_launch" },

  // Savannah — Appendix D Surgical Edit Packs (Pre-Launch)
  { content: "Appendix D.1 — Skidaway Island: Bryant, NATE, marine HVAC removal, solar removal, energy audit, 24/7, broken link", status: "pre_launch" },
  { content: "Appendix D.2 — Wilmington Island: Bryant, NATE, 24/7/365, solar removal, broken link", status: "pre_launch" },
  { content: "Appendix D.3 — Whitemarsh Island: Bryant, NATE, 24/7, SC-geography fix → Coastal GA, energy audit, solar removal, weather.com outbound link", status: "pre_launch" },
  { content: "Appendix D.4 — Bloomingdale: NATE (×2), 24/7, solar section removal, natex.org outbound link, broken link", status: "pre_launch" },
  { content: "Appendix D.5 — Richmond Hill: 24/7 (×3+), NATE, energy audit, solar section removal", status: "pre_launch" },
  { content: "Appendix D.6 — Rincon: '24 hours a day' variant, NATE, solar section removal, energy audit, forecast.weather.gov outbound link, broken link", status: "pre_launch" },
  { content: "Appendix D.7 — Hilton Head: broken link, seapines.com outbound link", status: "pre_launch" },
  { content: "Appendix D.8 — Bluffton: 'isn't not' double-negative typo, broken link, palmettobluff.com outbound link", status: "pre_launch" },
  { content: "Appendix D.9 — Tybee Island: 'AAction Airfocuses' + 'correctly. .' typos, broken link, visittybee.com outbound link", status: "pre_launch" },
  { content: "Appendix D.10 — Commercial HVAC: 2 broken links", status: "pre_launch" },
  { content: "Appendix D.11 — Ductless Mini-Split AC: 3 broken links, brand-list simplification (remove Bryant)", status: "pre_launch" },
  { content: "Appendix D.12 — Energy Efficiency: energy audit refs, 'Home Performance Testing' section removal, broken link, 'hey/get' typo. Marked for full rewrite within 30 days.", status: "pre_launch" },
  { content: "Appendix D.13 — Whole-Home Humidifier: N.A.T.E. (×2), 24/7, 5 broken internal links", status: "pre_launch" },

  // Savannah — Post-Launch Quality (30 days)
  { content: "About page rewrite — use Appendix B copy as written. Title tag and meta description included.", status: "post_launch" },
  { content: "Premier Service Plan rewrite — use Appendix C copy as written. Standardize naming to 'Premier Service Plan.'", status: "post_launch" },
  { content: "AC Installation full rewrite — content brief coming from James.", status: "post_launch" },
  { content: "Heat Pumps full rewrite — content brief coming from James. Include A2L refrigerant transition, Savannah climate fit, Georgia Power rebates. No federal tax credit references.", status: "post_launch" },
  { content: "Financing page full rewrite — beyond Service Finance correction. Add payment example, scope of what's covered.", status: "post_launch" },
  { content: "Energy Efficiency full rewrite — surgical-edit version ships at launch. Rewrite around what AAction actually offers.", status: "post_launch" },
  { content: "Contact page: add business hours block.", status: "post_launch" },
  { content: "All Gravity Forms: add ZIP code field. CSRs need this for service-area eligibility at intake.", status: "post_launch" },
  { content: "Contact form service dropdown: expand to add: Premier Service Plan, New System Consultation, Other / Not Sure.", status: "post_launch" },
  { content: "Reviews module: filter reviews on service pages to those mentioning the specific service.", status: "post_launch" },

  // Savannah — Strategic Content Rebuild
  { content: "Written remediation plan due May 22 — covering: scope confirmation, quality standard, timeline, editorial workflow, and pricing.", status: "needs_review" },
  { content: "Component A: Rebuild 11 existing city pages with real landmarks, typical home types, neighborhood-specific HVAC considerations.", status: "post_launch" },
  { content: "Component B: Build 5 new city pages: Garden City, Georgetown, Guyton, Hardeeville, Isle of Hope. Plus a new dedicated Savannah service area page.", status: "post_launch" },
  { content: "Component C: Build neighborhood pages within Savannah — Ardsley Park, Historic District, Victorian District, Starland District, Habersham Village, Skidaway Island / The Landings, Isle of Hope, others.", status: "post_launch" },
  { content: "Component D — STR HVAC page (/short-term-rental-hvac/). Strategic priority. Serves direct STR owners + STR management companies.", status: "post_launch" },
  { content: "Component D — Property Management HVAC page (/property-management-hvac/). Traditional residential and commercial PM companies. MSA structure, dedicated POC.", status: "post_launch" },
  { content: "Editorial workflow change — effective immediately. No content goes draft → staged until AAction (James) has reviewed.", status: "needs_review" },

  // Atlanta — Homepage
  { content: "Atlanta: Replace 'Your satisfaction is our goal' picture with one of the Atlanta staff", status: "pre_launch" },
  { content: "Atlanta: Drop the people picture below the property picture", status: "pre_launch" },
  { content: "Atlanta: Update Trust Badges: add CAAG, Greystone, Ruud, American Standard, AprilAire, Honeywell. Remove 'Bryant -BFAD' badge.", status: "pre_launch" },
  { content: "Atlanta: Add SC Mechanical Contractors number to footer.", status: "pre_launch" },
  { content: "Atlanta: Add 'American Standard – Co-Op Approved' badge to homepage.", status: "pre_launch" },
  { content: "Atlanta: Verify with James: Is 470-698-2247 a tracking number? Confirm before any swap.", status: "needs_review" },

  // Atlanta — Premier Service Plan Section
  { content: "Atlanta PSP: Add language: 'Customer will receive a computer analysis report of their system on each visit of service.'", status: "pre_launch" },
  { content: "Atlanta PSP: Plan Membership Benefits (A): change 'two year warranty on replacements' → 10 year labor warranty for qualifying systems", status: "pre_launch" },
  { content: "Atlanta PSP: Plan Membership Benefits (C): change 'one year warranty on repairs' → two year warranty on repairs", status: "pre_launch" },
  { content: "Atlanta PSP: Plan Membership Benefits (D): remove extended warranties on repairs and replacements; add one free diagnostic per plan", status: "pre_launch" },
  { content: "Atlanta PSP: Plan Membership Benefits (E): combine '10% discount on replacement and accessories' into one line item.", status: "pre_launch" },
  { content: "Atlanta PSP: Plan Membership Benefits (F): add additional system discounts on service plan", status: "pre_launch" },
  { content: "Atlanta PSP: Fix broken 'Join Today' button link in PSP section.", status: "pre_launch" },
  { content: "Atlanta PSP: Insert artwork for 'Club Membership PAYS$.. Ask us how!' when John provides it", status: "needs_review" },
  { content: "Atlanta PSP: Update plan pricing: 2026 ONLY $99.00 per plan per property (unlimited systems)", status: "pre_launch" },
  { content: "Atlanta PSP: Fix 'Learn More' button flow — forms aren't working. Forms need to be fixed.", status: "pre_launch" },
  { content: "Atlanta PSP: Fix 'Join Today' tab (currently not working — should route to form).", status: "pre_launch" },
]

async function importTasks() {
  // Find the AAction Air project
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, name')
    .ilike('name', '%aaction%')
    .limit(1)

  if (projectError) {
    console.error('Error finding project:', projectError)
    return
  }

  if (!projects || projects.length === 0) {
    console.error('Could not find AAction Air project. Available projects:')
    const { data: allProjects } = await supabase.from('projects').select('id, name')
    console.log(allProjects)
    return
  }

  const project = projects[0]
  console.log(`Found project: ${project.name} (${project.id})`)

  // Insert tasks
  let inserted = 0
  let failed = 0

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    const { error } = await supabase
      .from('project_tasks')
      .insert({
        project_id: project.id,
        content: task.content,
        status: task.status,
        position: i
      })

    if (error) {
      console.error(`Failed to insert task ${i}:`, error.message)
      failed++
    } else {
      inserted++
    }
  }

  console.log(`\nImport complete!`)
  console.log(`Inserted: ${inserted}`)
  console.log(`Failed: ${failed}`)
}

importTasks()
