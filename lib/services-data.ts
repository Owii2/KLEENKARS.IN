export interface ServiceDetail {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  heroImage: string;
  priceRange: string;
  overview: string;
  benefits: string[];
  processSteps: { step: string; title: string; description: string }[];
  idealFor: string[];
  faqs: { question: string; answer: string }[];
  relatedBlogSlug?: string;
}

export const SERVICES_DATA: Record<string, ServiceDetail> = {
  "ceramic-coating": {
    slug: "ceramic-coating",
    name: "9H & 10H Ceramic Coating Studio in Aligarh",
    shortName: "Ceramic Coating",
    tagline: "Ultra-Hydrophobic Glass Protection & Mirror Shine for Luxury Vehicles",
    metaTitle: "Ceramic Coating in Aligarh | 9H Nano Paint Shield — Kleenkars",
    metaDescription:
      "Shield your car paint with 9H & 10H Ceramic Coating in Aligarh. UV protection, scratch resistance, high-gloss hydrophobic shield, free pickup & drop.",
    focusKeyword: "ceramic coating Aligarh",
    heroImage: "/ceramic.png",
    priceRange: "Starting at ₹5,999",
    overview:
      "Kleenkars offers professional 9H and 10H nanoceramic coating treatments in Aligarh. Our SiO2 chemical bonding formula forms a permanent glass shield over your vehicle's clear coat, defending against UV oxidation, acid rain, bird droppings, dust accumulation, and hard water spots while maintaining a deep showroom mirror gloss.",
    benefits: [
      "9H / 10H Hardness Rating against micro-swirls and environmental erosion",
      "Super-Hydrophobic Water Beading Effect makes washing effortless",
      "Blocks UV rays to prevent paint fading, yellowing, and clear coat failure",
      "Stain resistance against bird droppings, tree sap, and hard water marks",
      "Includes multi-stage dual-action paint correction before coating application",
    ],
    processSteps: [
      {
        step: "01",
        title: "Decontamination Wash",
        description: "High-pressure foam wash followed by chemical iron fallout removal and clay bar treatment.",
      },
      {
        step: "02",
        title: "Paint Correction & Polish",
        description: "Dual-action machine compounding to eliminate 80-95% of existing swirl marks and oxidation.",
      },
      {
        step: "03",
        title: "Solvent Wipe & Surface Prep",
        description: "Isopropyl alcohol wipe-down ensuring a completely bare, oil-free surface for maximum bond.",
      },
      {
        step: "04",
        title: "Nano-Ceramic Application",
        description: "Hand application of multi-layer 9H SiO2 ceramic coating over paint, glass, chrome, and trim.",
      },
      {
        step: "05",
        title: "Infrared Heat Curing",
        description: "Accelerated IR lamp curing to lock in molecular hardness and glass clarity.",
      },
    ],
    idealFor: [
      "New car owners wanting to protect pristine factory clear coats",
      "Dark-colored cars prone to swirl marks and dust visibility",
      "Luxury sedan & SUV owners looking for long-term paint gloss",
    ],
    faqs: [
      {
        question: "How long does ceramic coating last on a car in Aligarh?",
        answer:
          "Our professional 9H ceramic coatings last between 2 to 5 years depending on the chosen tier and maintenance. Regular pH-neutral washing extends coating longevity.",
      },
      {
        question: "Does ceramic coating make my car completely scratch-proof?",
        answer:
          "Ceramic coating adds significant scratch resistance against micro-swirls and towel marks during washing, but it is not scratch-proof against deep keying or rock chips. For stone chip protection, we recommend Paint Protection Film (PPF).",
      },
      {
        question: "Do you provide pickup and drop for ceramic coating in Aligarh?",
        answer:
          "Yes! We offer free, safe vehicle pickup and drop across Aligarh for all ceramic coating packages.",
      },
    ],
    relatedBlogSlug: "complete-guide-to-ceramic-coating-india",
  },
  "paint-protection-film": {
    slug: "paint-protection-film",
    name: "TPU Paint Protection Film (PPF) in Aligarh",
    shortName: "Paint Protection Film (PPF)",
    tagline: "Self-Healing Clear Armor against Stone Chips, Scratches & Road Debris",
    metaTitle: "Paint Protection Film (PPF) in Aligarh | Clear Armor — Kleenkars",
    metaDescription:
      "Protect your car with self-healing TPU Paint Protection Film (PPF) in Aligarh. Defense against rock chips, scratches, key marks, and yellowing. Book online.",
    focusKeyword: "PPF Aligarh",
    heroImage: "/full_detailing.png",
    priceRange: "Starting at ₹35,000",
    overview:
      "Kleenkars specializes in ultra-clear Thermoplastic Polyurethane (TPU) Paint Protection Film (PPF) installation in Aligarh. Engineered to withstand high-velocity stone chips, road gravel, and parking scratches, our self-healing films heal surface scuffs when exposed to heat while maintaining perfect optical clarity.",
    benefits: [
      "Self-healing technology: minor scratches vanish with heat or hot water",
      "Superior protection against stone chips, highway gravel, and door dings",
      "Anti-yellowing and UV-stabilized clear film formula",
      "Hydrophobic topcoat repels mud, water spots, and bug splatters",
      "Computerized precision-cut film templates for flawless edge fitment",
    ],
    processSteps: [
      {
        step: "01",
        title: "Detailing Wash & Paint Prep",
        description: "Thorough foam decontamination wash and micro-polishing to perfect the underlying paint.",
      },
      {
        step: "02",
        title: "Digital Pattern Cutting",
        description: "Precision computer plotting tailored to exact vehicle make, model, and body panel dimensions.",
      },
      {
        step: "03",
        title: "Wet Slip Application",
        description: "Expert squeegee application ensuring zero bubbles, creases, or dust intrusion under film.",
      },
      {
        step: "04",
        title: "Edge Wrapping & Curing",
        description: "Tucking edges behind panel seams for an invisible, OEM-quality fitment.",
      },
    ],
    idealFor: [
      "Luxury SUV and super-sedan owners requiring maximum paint defense",
      "Frequent highway drivers exposed to flying stones and gravel",
      "New vehicle buyers wanting long-term resale value retention",
    ],
    faqs: [
      {
        question: "What is the difference between PPF and Ceramic Coating?",
        answer:
          "PPF is a physical clear film (180-200 microns thick) designed to absorb rock chips and scratches. Ceramic coating is a thin liquid nano-shield (2-3 microns) that provides hydrophobic dirt repellency and gloss, but cannot stop rock chips.",
      },
      {
        question: "Does PPF yellow over time under Aligarh sun?",
        answer:
          "No, Kleenkars uses premium TPU films with optical UV stabilizers that prevent yellowing, cracking, or peeling even under intense Indian sun exposure.",
      },
    ],
    relatedBlogSlug: "ppf-vs-ceramic-coating-guide",
  },
  "paint-correction": {
    slug: "paint-correction",
    name: "Dual-Action Paint Correction & Polishing in Aligarh",
    shortName: "Paint Correction",
    tagline: "Restore Showroom Depth & Eliminate 90%+ of Swirl Marks and Scratches",
    metaTitle: "Paint Correction & Car Polishing in Aligarh — Kleenkars Studio",
    metaDescription:
      "Professional dual-action paint correction and scratch removal in Aligarh. Eliminate swirl marks, buffer trails, and oxidation. Restore factory gloss.",
    focusKeyword: "paint correction Aligarh",
    heroImage: "/full_detailing.png",
    priceRange: "Starting at ₹1,499",
    overview:
      "Over time, dry rag wipes, harsh wash sponges, and environmental contamination create microscopic scratches known as swirl marks. Kleenkars' multi-stage dual-action paint correction process carefully levels clear coat imperfections, permanently eliminating swirl marks, buffer trails, and oxidation to reveal pure mirror gloss.",
    benefits: [
      "Permanently eliminates 80-95% of swirl marks, cobwebbing, and light scratches",
      "Restores rich color depth and high-definition clarity to faded paint",
      "Prepares bare clear coat for ceramic sealants or PPF adhesion",
      "Digital paint depth gauge monitoring ensures safe clear coat preservation",
    ],
    processSteps: [
      {
        step: "01",
        title: "Paint Inspection & Depth Gauge Check",
        description: "Measuring clear coat thickness across all body panels using digital ultrasonic gauges.",
      },
      {
        step: "02",
        title: "Heavy Compound Stage",
        description: "Using rotary/dual-action polishers with micro-cutting pads to remove deeper swirl marks.",
      },
      {
        step: "03",
        title: "Fine Finishing Polish",
        description: "Refining the surface with ultra-fine polish to remove micro-marring and lock in high gloss.",
      },
      {
        step: "04",
        title: "Sealant Application",
        description: "Protecting the newly corrected paintwork with a synthetic gloss sealant.",
      },
    ],
    idealFor: [
      "Vehicles with heavy swirl marks from daily dry cloth dusting",
      "Pre-owned car purchases needing full paint restoration",
      "Cars preparing for Ceramic Coating or PPF installation",
    ],
    faqs: [
      {
        question: "Does paint correction remove deep key scratches?",
        answer:
          "Paint correction removes scratches that reside within the clear coat layer. If a scratch has penetrated past the clear coat into the primer or metal base, it may require touch-up paint rather than polishing.",
      },
    ],
    relatedBlogSlug: "paint-correction-scratch-removal-guide",
  },
  "interior-detailing": {
    slug: "interior-detailing",
    name: "Interior Detailing & Steam Cleaning Spa in Aligarh",
    shortName: "Interior Detailing",
    tagline: "140°C Steam Sanitization, Leather Conditioning & Deep Stain Extraction",
    metaTitle: "Car Interior Detailing & Steam Spa in Aligarh — Kleenkars",
    metaDescription:
      "Deep car interior detailing & steam sanitization in Aligarh. 140°C steam cleaning, leather conditioning, AC duct disinfection, stain & odor removal.",
    focusKeyword: "interior detailing Aligarh",
    heroImage: "/deepclean.png",
    priceRange: "Starting at ₹1,299",
    overview:
      "Your car cabin is a closed environment where dust, sweat, bacteria, and allergens accumulate in fabric fibers and AC vents. Kleenkars' Interior Steam Spa utilizes 140°C pressurized dry steam to deep clean seats, floor carpets, headliners, and dashboard panels while sanitizing the entire air conditioning circulation system.",
    benefits: [
      "Kills 99.9% of bacteria, mold, and dust mites inside seat cushions and carpets",
      "Deep hot-water extraction removes stubborn food, coffee, and mud stains",
      "Neutralizes stubborn odors from moisture, pets, and tobacco smoke",
      "Nourishes genuine leather upholstery with non-greasy UV block conditioners",
      "AC duct fogging eliminates damp smells and improves cabin air quality",
    ],
    processSteps: [
      {
        step: "01",
        title: "Compressed Air Crevice Purging",
        description: "Blowing out trapped dust from seat rails, button clusters, and vent seams.",
      },
      {
        step: "02",
        title: "140°C Dry Steam Extraction",
        description: "Sanitizing seat fabrics, floor carpets, and roof linings with pressurized dry steam.",
      },
      {
        step: "03",
        title: "Leather & Vinyl Conditioning",
        description: "Cleaning hide pores with pH-balanced leather food and matte interior dressing.",
      },
      {
        step: "04",
        title: "AC System Disinfection",
        description: "Ozone/anti-bacterial fogging into blower vents for fresh air circulation.",
      },
    ],
    idealFor: [
      "Families with children or pets requiring hygienic, sanitized interiors",
      "Vehicles with spilled food, beverage stains, or damp odors",
      "Pre-owned car buyers wanting a completely refreshed cabin",
    ],
    faqs: [
      {
        question: "How long does interior detailing take to dry?",
        answer:
          "We use commercial dry steam and high-velocity air movers so your car seats and carpets are 95% dry upon delivery, ready to drive within 1-2 hours.",
      },
    ],
    relatedBlogSlug: "interior-detailing-health-guide",
  },
  "car-wash": {
    slug: "car-wash",
    name: "Doorstep Premium Foam Car Wash in Aligarh",
    shortName: "Premium Car Wash",
    tagline: "pH-Neutral Snow Foam, Soft Filtered Water & Doorstep Pickup Service",
    metaTitle: "Car Wash in Aligarh | Doorstep Pickup & Premium Foam Wash — Kleenkars",
    metaDescription:
      "Aligarh's top-rated doorstep car wash service. Soft filtered water, pH-neutral snow foam, underbody blast, interior vacuuming, free pickup & drop.",
    focusKeyword: "car wash Aligarh",
    heroImage: "/rainyday.png",
    priceRange: "Starting at ₹149",
    overview:
      "Kleenkars redefines routine car washing in Aligarh. Unlike roadside washes using hard water and harsh detergents that dull paint, we utilize soft filtered water, thick pH-neutral snow foam cannons, plush 500+ GSM microfiber drying towels, and comprehensive underbody pressure blasts—with convenient doorstep pickup across Aligarh.",
    benefits: [
      "pH-Neutral Snow Foam safely lifts dirt without stripping existing wax or ceramic coating",
      "100% Soft Filtered Water prevents hard water calcium spot deposits",
      "Underbody High-Pressure Washer clears corrosive road mud and grime",
      "Includes interior cabin vacuuming, dashboard wipe, and tire gloss dressing",
      "Free Doorstep Pickup & Drop service across Aligarh",
    ],
    processSteps: [
      {
        step: "01",
        title: "Pre-Rinse & Underbody Blast",
        description: "High-pressure water rinse to knock off loose mud, wheel arch dust, and road salt.",
      },
      {
        step: "02",
        title: "Snow Foam Bath",
        description: "Coating the vehicle in rich pH-neutral foam to break down surface oils and dirt particles.",
      },
      {
        step: "03",
        title: "Two-Bucket Microfiber Wash",
        description: "Gently agitating paint using grit-guarded buckets and plush microfiber wash mitts.",
      },
      {
        step: "04",
        title: "Filter Water Rinse & Blow Dry",
        description: "Spot-free rinse and streak-free drying with warm air blower and plush drying towels.",
      },
    ],
    idealFor: [
      "Weekly vehicle maintenance for sedan, hatchback, MUV, and SUV owners",
      "Busy professionals wanting doorstep pickup & drop without waiting",
      "Car owners wanting a scratch-free alternative to dry rag wiping",
    ],
    faqs: [
      {
        question: "Do you pick up the car from home or office in Aligarh?",
        answer:
          "Yes! Simply choose your preferred slot online, and our trained driver will pick up your car, perform the detailing at our studio, and safely return it.",
      },
    ],
    relatedBlogSlug: "car-wash-maintenance-schedule-aligarh",
  },
  "car-spa": {
    slug: "car-spa",
    name: "Full Vehicle Spa & Exterior Detailing in Aligarh",
    shortName: "Full Car Spa",
    tagline: "Complete 360° Interior & Exterior Deep Refresh Package",
    metaTitle: "Car Spa in Aligarh | Full Vehicle Detailing Package — Kleenkars",
    metaDescription:
      "Transform your car with a Full Vehicle Spa in Aligarh. Exterior foam wash, paint gloss enhancement, interior steam cleaning, wheel restoration, and tire shine.",
    focusKeyword: "car spa Aligarh",
    heroImage: "/tyre&rim.png",
    priceRange: "Starting at ₹399",
    overview:
      "The Kleenkars Full Car Spa is our flagship 360-degree deep care treatment. Designed to treat every inch of your automobile, it combines an exterior decontamination wash, single-stage gloss polish, complete interior steam cleaning, alloy wheel restoration, glass sealant, and engine bay dress.",
    benefits: [
      "Complete 360° vehicle refresh inside and out",
      "Single-stage machine polish enhances paint gloss and removes surface haze",
      "Interior cabin steam sanitized, vacuumed, and conditioned",
      "Alloy wheel brake dust decontamination and tyre dressing",
    ],
    processSteps: [
      {
        step: "01",
        title: "Exterior Foam & Decontamination Wash",
        description: "Pressure foam wash, wheel arch degreasing, and clay bar treatment.",
      },
      {
        step: "02",
        title: "Paint Gloss Polish",
        description: "Single-stage machine polish for enhanced depth and reflection.",
      },
      {
        step: "03",
        title: "Interior Steam Spa",
        description: "Deep vacuuming, steam sanitization of seats, carpets, and AC duct cleaning.",
      },
      {
        step: "04",
        title: "Glass & Trim Dressing",
        description: "Hydrophobic rain repellent on glass and UV shield dressing on exterior plastics.",
      },
    ],
    idealFor: [
      "Pre-festival or wedding season vehicle preparation",
      "Bi-annual deep vehicle maintenance",
      "Car owners wanting a complete transformation package",
    ],
    faqs: [
      {
        question: "How long does a Full Car Spa take?",
        answer:
          "A Full Car Spa typically takes 4 to 6 hours at our studio to ensure every detail is completed meticulously.",
      },
    ],
    relatedBlogSlug: "car-wash-maintenance-schedule-aligarh",
  },
};
