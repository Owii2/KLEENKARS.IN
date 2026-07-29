const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SEO blog posts...');

  // 1. Ensure Default Author
  let author = await prisma.author.findUnique({
    where: { email: 'info@kleenkars.in' },
  });

  if (!author) {
    author = await prisma.author.create({
      data: {
        name: 'Kleenkars Master Detailer',
        email: 'info@kleenkars.in',
        bio: 'Certified Auto Detailing Specialist with over 8 years of experience in paint correction, ceramic coatings, and premium vehicle preservation.',
      },
    });
  }

  // 2. Ensure Categories
  const categoryNames = ['Ceramic Coating', 'Paint Protection Film', 'Interior Detailing', 'Car Care Tips', 'Paint Correction'];
  const categoryMap = {};

  for (const name of categoryNames) {
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    let cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name,
          slug,
          description: `Professional articles and guides about ${name}.`,
        },
      });
    }
    categoryMap[name] = cat;
  }

  // 3. Ensure Tags
  const tagNames = ['Aligarh Car Detailing', 'Ceramic Coating', 'PPF', 'Car Wash', 'Paint Protection', 'Interior Cleaning', 'Car Spa'];
  const tagMap = {};

  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    let tag = await prisma.tag.findUnique({ where: { slug } });
    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name,
          slug,
        },
      });
    }
    tagMap[name] = tag;
  }

  // 4. Articles Data
  const articles = [
    {
      title: 'Complete Guide to 9H & 10H Ceramic Coating: Cost, Benefits & Maintenance in India',
      slug: 'complete-guide-to-ceramic-coating-india',
      excerpt: 'Discover everything about 9H & 10H ceramic coating for cars in India: hydrophobic shine, paint protection, UV damage defense, swirl mark prevention, and maintenance tips.',
      category: 'Ceramic Coating',
      tags: ['Ceramic Coating', 'Aligarh Car Detailing', 'Paint Protection'],
      focusKeyword: 'Ceramic Coating Aligarh',
      seoTitle: 'Complete Guide to Ceramic Coating in India | Kleenkars',
      seoDescription: 'Learn how 9H ceramic coating protects your car paint from UV rays, dust, and hard water in India. Professional guide from Kleenkars Aligarh.',
      content: `Car ownership in India brings continuous exposure to harsh sunlight, dust, industrial fallout, bird droppings, and hard water stains. Over time, these environmental factors strip away your car's natural clear coat gloss, resulting in dull paint and swirl marks.

Ceramic coating has emerged as the gold standard in automotive paint protection. In this comprehensive guide, our detailing specialists at Kleenkars explain how ceramic coating works, its benefits, application process, and long-term care.

What is Ceramic Coating?
Ceramic coating is a liquid polymer infused with Silicon Dioxide (SiO2) or Silicon Carbide (SiC). When applied onto a clean car surface, it chemically bonds with the factory clear coat to form an ultra-durable, hydrophobic nanoceramic protective layer.

Key Benefits of 9H & 10H Ceramic Coatings:
1. Extreme Hydrophobic Shield: Water and mud bead up and slide off effortlessly, keeping your car cleaner for much longer.
2. UV & Thermal Protection: Prevents clear coat oxidation, paint fading, and yellowing caused by harsh sunlight in Uttar Pradesh.
3. Chemical & Stain Resistance: Shields against acid rain, bird lime, tree sap, and hard water minerals.
4. Intense Mirror Gloss: Enhances paint depth, creating a glass-like shine that waxes cannot match.
5. Swirl Mark Resistance: While not completely scratch-proof, the hard 9H/10H ceramic layer reduces fine washing swirls.

The Professional Ceramic Coating Process at Kleenkars:
- Step 1: Decontamination Wash & Clay Bar Treatment to remove surface contaminants.
- Step 2: Dual-Action Paint Correction to polish out 80–90% of existing swirl marks and light scratches.
- Step 3: Isopropyl Solvent Wipe down to strip remaining oils.
- Step 4: Layered Ceramic Coating Application over paint, chrome, glass, and alloy trim.
- Step 5: Infrared Curing for maximum bond strength.

How to Maintain Your Ceramic Coated Car:
- Wash every 1–2 weeks using pH-neutral car shampoo.
- Avoid automatic friction car washes with harsh bristle brushes.
- Use clean 400+ GSM microfiber towels for drying.
- Apply a ceramic booster spray every 6 months to revive hydrophobicity.

Whether you drive a new sedan or wish to restore an older vehicle, ceramic coating provides unbeatable long-term protection and showroom elegance.`
    },
    {
      title: 'Paint Protection Film (PPF) vs Ceramic Coating: Which is Right for Your Car?',
      slug: 'ppf-vs-ceramic-coating-guide',
      excerpt: 'Compare self-healing Paint Protection Film (PPF) and Ceramic Coating. Understand scratch resistance, durability, cost factors, and which protective option fits your driving habits.',
      category: 'Paint Protection Film',
      tags: ['PPF', 'Ceramic Coating', 'Paint Protection'],
      focusKeyword: 'Paint Protection Film Aligarh',
      seoTitle: 'PPF vs Ceramic Coating Comparison | Kleenkars Detailing',
      seoDescription: 'Compare TPU Paint Protection Film (PPF) and 9H Ceramic Coating. Learn pros, cons, costs, and which option best shields your vehicle in India.',
      content: `When protecting your vehicle's paintwork, two major options dominate the automotive detailing industry: Paint Protection Film (PPF) and Ceramic Coating. While both aim to keep your car looking brand new, they serve different primary functions.

What is Paint Protection Film (PPF)?
PPF is a high-grade Thermoplastic Polyurethane (TPU) transparent film applied directly over the painted panels. It absorbs physical impacts from flying stones, minor scratches, keys, and road debris. Premium TPU films feature self-healing technology where heat from sunlight or warm water automatically heals light surface scratches.

What is Ceramic Coating?
Ceramic Coating is a liquid nano-coating that cures into a hardened hydrophobic glass layer. It offers unmatched chemical resistance, UV protection, and deep gloss, but does not absorb physical stone chip impacts.

PPF vs Ceramic Coating: Direct Comparison

1. Impact & Scratch Protection:
- PPF: Outstanding (prevents stone chips, key scratches, and deep scrapes).
- Ceramic Coating: Moderate (protects against micro-swirls, but not rock chips).

2. Gloss & Hydrophobic Properties:
- PPF: Good gloss and water repellency (modern top-coated PPFs are hydrophobic).
- Ceramic Coating: Unbeatable glass-like depth and slick hydrophobic finish.

3. Self-Healing Abilities:
- PPF: Yes (minor scratches disappear under heat).
- Ceramic Coating: No.

4. Lifespan:
- PPF: 5 to 10 years depending on TPU film grade.
- Ceramic Coating: 2 to 5 years depending on coating quality and maintenance.

Which Should You Choose?
- Choose PPF if you frequently drive on highways, own a luxury car, or want maximum defense against physical stone chips and scratches.
- Choose Ceramic Coating if your main goal is deep paint gloss, easy washing, UV defense, and hydrophobic dirt repellency at a lower investment cost.
- The Ultimate Setup: Many car enthusiasts combine both by applying PPF on high-impact front panels (bumper, bonnet, fenders) and Ceramic Coating over the entire vehicle body!`
    },
    {
      title: 'Why Interior Detailing & Steam Spa is Essential for Health and Vehicle Hygiene',
      slug: 'interior-detailing-health-guide',
      excerpt: 'Learn why regular interior car detailing and high-temperature steam cleaning are vital for health, bacterial sanitization, air quality, and upholstery longevity.',
      category: 'Interior Detailing',
      tags: ['Interior Cleaning', 'Car Spa', 'Aligarh Car Detailing'],
      focusKeyword: 'Interior Detailing Aligarh',
      seoTitle: 'Car Interior Detailing & Steam Cleaning Guide | Kleenkars',
      seoDescription: 'Discover the health benefits of professional car interior steam detailing, AC duct sanitization, and upholstery stain removal at Kleenkars Aligarh.',
      content: `Most car owners wash the exterior of their car regularly, but the interior cabin—where passengers spend hours breathing recirculated air—is frequently overlooked.

Studies show that vehicle steering wheels, gear shifters, door handles, and AC ducts can harbour more bacteria and allergens than a typical public restroom surface!

Why Standard Vacuuming Isn't Enough:
Daily use brings dust, food crumbs, sweat, spillages, and footwear grime deep into fabric carpets and seat cushions. Standard vacuuming removes surface dirt, but leaves behind trapped bacteria, fungal spores, dust mites, and persistent odours inside seat foam and climate control ducts.

The Kleenkars Interior Steam Spa Process:
1. Deep Vacuuming & Compressed Air Purging: Extract loose dust from seat crevices, dashboard vents, and floor mats.
2. High-Temperature Steam Sanitization: 140°C pressurized dry steam kills 99.9% of bacteria and dust mites in seat fabrics, carpets, and headliners without saturating the interior.
3. AC Duct Disinfection: Anti-bacterial fogging clears mold and stale moisture smells from evaporator coils and air vents.
4. Leather & Vinyl Conditioning: pH-balanced leather cleaners extract embedded grime and nourish hide fibers with UV block conditioners to prevent cracking.
5. Roof Headliner & Dashboard Restoration: Non-greasy matte dressings protect plastics against sun damage and discoloration.

Health & Comfort Benefits:
- Allergy Relief: Removes pollen, dust mites, and pet dander.
- Odour Elimination: Destroys stubborn food, smoke, and moisture smells at the source.
- Preserves Resale Value: A pristine, stain-free interior commands significantly higher resale value.

Give your family a clean, hygienic cabin with Kleenkars' Interior Spa treatments in Aligarh.`
    },
    {
      title: 'How Often Should You Wash and Detail Your Car in Aligarh\'s Climate?',
      slug: 'car-wash-maintenance-schedule-aligarh',
      excerpt: 'A complete seasonal car care maintenance schedule tailored for vehicle owners in Aligarh and Uttar Pradesh. Protect your car in summer heat, monsoon rain, and winter smog.',
      category: 'Car Care Tips',
      tags: ['Car Wash', 'Aligarh Car Detailing', 'Car Care Tips'],
      focusKeyword: 'Car Wash Aligarh',
      seoTitle: 'Seasonal Car Wash & Maintenance Schedule for Aligarh',
      seoDescription: 'Find the ideal car washing and detailing frequency for Aligarh climate conditions. Expert tips on protecting paint, interiors, and underbody.',
      content: `Maintaining a pristine vehicle in Aligarh requires understanding local climate challenges. From intense summer heat and monsoon downpours to winter dust and agricultural fallout, seasonal shifts impact your car's exterior paintwork and mechanical components.

Recommended Car Washing Frequency:
- Weekly / Bi-Weekly Foam Wash: A gentle pH-neutral pressure wash removes surface dust and mud before contaminants bond to the clear coat.
- Avoid Dry Cloth Wiping: Wiping dry dust with a cloth or duster drags sharp dirt particles across the paint, causing fine swirl marks.

Seasonal Maintenance Checklist for Aligarh Drivers:

1. Summer Care (March – June):
- Threat: UV rays oxidation, dashboard fading, bird droppings.
- Action: Apply synthetic wax or ceramic sealant to block UV radiation. Park in shaded areas and install windshield sunshades.

2. Monsoon Care (July – September):
- Threat: Rain acid etching, underbody mud buildup, humidity mold inside the cabin.
- Action: Get a hydro-shield coat (e.g. Kleenkars Rainy Day Shine) and underbody anti-rust pressure wash to prevent corrosion.

3. Winter & Smog Care (October – February):
- Threat: Heavy smog residue, dew spots, dust accumulation.
- Action: Deep interior vacuuming and microfiber glass cleaning for fog-free windshield visibility.

Why Choose Doorstep Pickup & Professional Service:
Using unfiltered hard groundwater or local bucket washes with household detergents strips away protective coatings. Kleenkars uses soft filtered water, professional foam cannons, and plush microfiber towels to preserve your paint's factory finish.`
    },
    {
      title: 'Paint Correction & Scratch Removal: How to Restore Showroom Gloss to Faded Paint',
      slug: 'paint-correction-scratch-removal-guide',
      excerpt: 'Learn how dual-action paint correction safely removes 80-95% of swirl marks, scratches, buffer trails, and oxidation without damaging clear coat depth.',
      category: 'Paint Correction',
      tags: ['Paint Correction', 'Aligarh Car Detailing', 'Paint Protection'],
      focusKeyword: 'Paint Correction Aligarh',
      seoTitle: 'Paint Correction & Scratch Removal Guide | Kleenkars',
      seoDescription: 'Learn how multi-stage paint correction restores faded paint and removes swirl marks safely. Professional detailing guide by Kleenkars Aligarh.',
      content: `Have you ever looked at your car under direct sunlight and noticed web-like circular scratch patterns all over the body panels? These are known as swirl marks or spiderweb scratches.

What Causes Swirl Marks & Paint Fading?
- Wiping paint with dirty or dry towels.
- Automatic car washes with harsh plastic brushes.
- Using dish soaps or high-alkaline detergents.
- Acidic rain, bird droppings, and tree sap left untreated.

What is Paint Correction?
Paint correction is the specialized process of leveling the vehicle's clear coat using dual-action machine polishers, abrasive compounds, and microscopic pad technology. Unlike cheap waxes that temporarily mask scratches with fillers, paint correction permanently eliminates paint defects.

Stages of Paint Correction:

1. One-Stage Correction (Gloss Enhancement):
Uses a medium-cut polish to remove light hazing and minor micro-swirls while boosting paint clarity by 50–60%. Ideal for newer vehicles.

2. Two-Stage Correction (Swirl Removal):
Combines a heavy cutting compound to eliminate 80–90% of medium scratches, followed by a finishing polish to refine clarity and depth.

3. Multi-Stage Correction (Restoration):
Reserved for heavily oxidized, scratched, or vintage cars. Involves localized wet sanding, heavy compounding, medium polishing, and ultra-fine finishing.

Preserving Clear Coat Depth:
Clear coat paint thickness is measured in microns. At Kleenkars, our detailers utilize digital paint depth gauges before polishing to ensure safe clear coat thickness is maintained.

After paint correction is complete, applying a 9H Ceramic Coating or TPU PPF ensures your newly restored finish remains protected for years to come.`
    }
  ];

  for (const art of articles) {
    const category = categoryMap[art.category];
    const tags = art.tags.map(t => tagMap[t]).filter(Boolean);

    let post = await prisma.blogPost.findUnique({
      where: { slug: art.slug },
    });

    if (!post) {
      await prisma.blogPost.create({
        data: {
          title: art.title,
          slug: art.slug,
          excerpt: art.excerpt,
          content: art.content,
          status: 'published',
          publishedAt: new Date(),
          authorId: author.id,
          seoTitle: art.seoTitle,
          seoDescription: art.seoDescription,
          focusKeyword: art.focusKeyword,
          categories: {
            connect: [{ id: category.id }],
          },
          tags: {
            connect: tags.map(t => ({ id: t.id })),
          },
        },
      });
      console.log(`Created SEO article: ${art.title}`);
    } else {
      console.log(`Article already exists: ${art.title}`);
    }
  }

  console.log('SEO Blog Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
