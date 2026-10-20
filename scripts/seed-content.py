"""Writes the starting content for the site.

Run once, to seed the CMS with Mandie's own wording (from her Instagram and
cal.com pages) plus the mockup's example items. Anything not in her words is
marked [PLACEHOLDER] so nothing invented ships by accident. After launch the
content belongs to Keystatic and this script should not be run again: it
overwrites whatever she has saved.
"""
import json
import os
import sys

if os.path.exists('src/content/settings.json') and '--force' not in sys.argv:
    sys.exit('Content already exists. Re-running would overwrite her edits. Pass --force if you really mean it.')

P = '../../assets/images/pages/'


def w(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')


w('src/content/settings.json', {
    "tagline": "Bristol's houseplant hospital. Don't bin it. Book it in.",
    "description": "Sick, sad or struggling houseplant? Thrive Plants Bristol diagnose, treat and revive it. Drop off at the Houseplant Hospital or book a pick-up across BS1 to BS9, from £8.",
    "whatsapp": "https://wa.me/qr/CC5KLPTIHACMH1",
    "instagram": "https://www.instagram.com/thriveplantsbristol/",
    "email": "",
    "serviceArea": "BS1 to BS9",
    "calUser": "thrive-plants-bristol",
    "dropOffEvent": "drop-off",
    "pickUpEvent": "pick-up",
    "shareImage": "../assets/images/pages/philodendron-sun.jpg",
    "shareImageAlt": "A large philodendron in a pot against a sunlit wall",
})

w('src/content/pages/home.json', {
    "heroLine1": "Don't bin it.",
    "heroLine2": "Book it in.",
    "heroLead": "Sick, sad or struggling houseplant? Brown tips. Dropped leaves. Bugs you can't name. Bristol's houseplant hospital will diagnose, treat and revive it, from £8.",
    "heroImage": P + "philodendron-sun.jpg",
    "stepsHeading": "Rescue. Revive. Return.",
    "steps": [
        {"title": "Rescue", "body": "Book a slot to drop off, or we can pick up. Free collection for 3 or more plants, BS1 to BS9."},
        {"title": "Revive", "body": "Every plant is properly assessed and treated at the thrive Houseplant Hospital, from a quick repot to full pest treatment."},
        {"title": "Return", "body": "Your plant comes back revived, with its own care card so you know what it needs to thrive."},
    ],
    "symptomsHeading": "Sound familiar?",
    "symptomsIntro": "If your plant is ticking any of these boxes, it's time for a check-up. Tap one to book in.",
    "symptoms": [
        {"label": "Bugs on the leaves", "icon": "bug"},
        {"label": "Yellowing leaves", "icon": "leaf"},
        {"label": "Monstera out of control", "icon": "maximize-2"},
        {"label": "Overwatered", "icon": "droplets"},
        {"label": "Roots sticking out", "icon": "shovel"},
        {"label": "Fungus gnats", "icon": "bug-off"},
        {"label": "Leaning over", "icon": "sun"},
        {"label": "Dusty leaves", "icon": "wind"},
        {"label": "Crispy brown tips", "icon": "flame"},
        {"label": "Forgot to water it", "icon": "glass-water"},
        {"label": "Leaves dropping off", "icon": "arrow-down"},
        {"label": "Thrive to the rescue", "icon": "heart-pulse"},
    ],
    "servicesHeading": "Plants, pots and proper care",
    "services": [
        {"title": "Houseplant Hospital", "body": "Diagnosis, repotting and pest treatment for plants that need a little help.", "link": "/hospital", "linkLabel": "Treatments and prices", "image": P + "monstera-curtain.jpg"},
        {"title": "Pre-loved pots and plants", "body": "Healthy plants rehomed in second-hand ceramic pots. Each one is a one-off.", "link": "/shop", "linkLabel": "Visit the shop", "image": P + "aglaonema-pink.jpg"},
        {"title": "Offices and restaurants", "body": "Plants supplied and looked after, so your space stays green without the stress.", "link": "/business", "linkLabel": "Plant care for business", "image": P + "strelitzia-warm.jpg"},
        {"title": "Gift vouchers", "body": "Know someone with a plant on its last legs? Give them a check-up.", "link": "/vouchers", "linkLabel": "Buy a voucher", "image": None},
    ],
    "patientsHeading": "Recent patients",
    "patients": [
        {"title": "Snake plant", "note": "Root rot. Trimmed, dried out and repotted in gritty mix.", "image": P + "snake-cream.jpg", "placeholder": True},
        {"title": "Lovely jade plant", "note": "Mineral deposit build-up. Cleaned, flushed and fed.", "image": P + "jade.jpg", "placeholder": True},
        {"title": "Calathea", "note": "Crispy edges. A humidity plan and a new spot away from the radiator.", "image": P + "calathea-head.jpg", "placeholder": True},
        {"title": "A monster of a Monstera", "note": "Rootbound. Divided, staked and back home.", "image": P + "monstera-beige.jpg", "placeholder": True},
    ],
    "aboutEyebrow": "Hey, I'm Mandie",
    "aboutHeading": "Bristol's first houseplant hospital, born in my back garden.",
    "aboutBody": "I've been helping revive friends' houseplants for decades, so a move to focus on plants wasn't that strange. If you need help with a plant, get in touch.",
    "aboutImage": P + "mandie.jpg",
})

w('src/content/pages/hospital.json', {
    "heading": "We diagnose, treat and revive.",
    "intro": "From a quick repot to full pest treatment, every plant is properly assessed and goes home with its own care card.",
    "dropOff": "Book a 15 minute slot to bring your plant to the thrive Houseplant Hospital. We'll check your plants on arrival and give an assessment of what they need to thrive.",
    "pickUp": "We collect from your doorstep, take your plant to the Houseplant Hospital for a full assessment and treatment, then return it once it's ready. BS1 to BS9. Free collection for 3 or more plants, or £8 for 1 or 2.",
    "treatmentsHeading": "What we can do",
    "treatments": [
        {"name": "Health check and diagnosis", "description": "A proper look at leaves, roots and soil, and a plan.", "price": "From £8"},
        {"name": "Repotting", "description": "Fresh mix, a root tidy, and a pre-loved pot if it needs one.", "price": "From £8"},
        {"name": "Pest treatment", "description": "Mealybugs, spider mites, fungus gnats, scale and thrips.", "price": "On assessment"},
        {"name": "Full rescue", "description": "Root rot, overwatering and serious decline.", "price": "On assessment"},
        {"name": "Prune and propagate", "description": "Tame an out of control plant, and save cuttings to grow on.", "price": "On assessment"},
    ],
    "treatmentsNote": "[PLACEHOLDER] Prices to be confirmed by Mandie.",
    "careCard": {
        "plant": "Monstera deliciosa",
        "light": "Bright, indirect. Not in a south window.",
        "water": "When the top 3cm of soil is dry.",
        "feed": "Monthly, spring to late summer.",
        "treated": "Root rot. Trimmed and repotted into chunky aroid mix.",
    },
    "faqs": [
        {"question": "How long will my plant stay at the hospital?", "answer": "[PLACEHOLDER] It depends on the treatment. A repot can be the same week; a pest treatment or full rescue needs longer so we can check it's really working. We'll always give you an estimate at drop-off."},
        {"question": "What if my plant can't be saved?", "answer": "[PLACEHOLDER] We'll be honest with you. Often we can still take healthy cuttings and propagate them, so a piece of your plant lives on."},
        {"question": "Do you treat orchids and succulents?", "answer": "[PLACEHOLDER] Yes. Orchids struggling after the summer heat are a regular visitor, and succulents and cacti are welcome too."},
        {"question": "Where is the Houseplant Hospital?", "answer": "In Bristol. You'll get the full address when you book your drop-off slot."},
    ],
    "image": P + "monstera-curtain.jpg",
})

w('src/content/pages/shop.json', {
    "heading": "Happy plants in pre-loved pots.",
    "intro": "Healthy plants rehomed in second-hand ceramic pots. Not every pot we use is new, and that's the point. Each one is a one-off.",
    "comingSoon": True,
    "promises": [
        {"title": "Second-hand pots", "body": "[PLACEHOLDER] Rescued from charity shops and car boots, cleaned and given a new life."},
        {"title": "Hospital-checked", "body": "[PLACEHOLDER] Every plant is health-checked and pest-free before it goes to a new home."},
        {"title": "Comes with a care card", "body": "So you know exactly what it likes from day one."},
    ],
    "emptyBasket": "Your basket is empty. Every plant in the shop is a one-off, so if you see one you love, grab it.",
    "afterOrder": "Thank you. Your plant is yours, and a receipt is on its way by email. We'll be in touch to arrange collection or delivery.",
})

w('src/content/pages/business.json', {
    "heading": "Green spaces, without the stress.",
    "intro": "[PLACEHOLDER] We supply plants that suit your space and keep them looking their best with regular care visits, so you never have to think about it.",
    "image": P + "palm.jpg",
    "imageAlt": "An areca palm in a white pot",
    "offers": [
        {"title": "Supply", "body": "[PLACEHOLDER] The right plants for your light, layout and budget, potted in pre-loved ceramics where we can."},
        {"title": "Care visits", "body": "[PLACEHOLDER] Weekly, fortnightly or monthly: watering, feeding, cleaning leaves, pruning and pest checks."},
        {"title": "Rescue", "body": "[PLACEHOLDER] Struggling plants taken to the Houseplant Hospital and swapped out while they recover."},
    ],
    "whoHeading": "Any space that should feel alive",
    "who": [
        {"label": "Offices and studios", "icon": "briefcase"},
        {"label": "Restaurants", "icon": "utensils-crossed"},
        {"label": "Cafés and bars", "icon": "coffee"},
        {"label": "Shops and salons", "icon": "store"},
    ],
    "formHeading": "Tell us about your space",
    "formIntro": "Where you are in Bristol, roughly how many plants, and what you have in mind. We'll get back to you to arrange a visit.",
})

w('src/content/pages/vouchers.json', {
    "heading": "Give the gift of a plant check-up.",
    "intro": "For the friend with a droopy fiddle leaf fig, or anyone who loves their plants. Vouchers can be used on any hospital treatment or in the shop.",
    "amounts": [15, 25, 50, 75],
    "points": [
        "[PLACEHOLDER] Sent by email as a printable voucher",
        "[PLACEHOLDER] Valid for 12 months",
        "Use it on treatments, pick-ups or the shop",
    ],
    "afterOrder": "Thank you. Your receipt is on its way by email, and we'll send the voucher itself within a day.",
})

w('src/content/pages/book.json', {
    "heading": "Pick a slot, we'll do the rest.",
    "intro": "Drop your plant off at the Houseplant Hospital, or we'll come and collect it.",
    "dropOffTitle": "Drop off at the thrive Houseplant Hospital",
    "dropOffBody": "Book a slot to drop off your houseplant. We'll check it on arrival and give an assessment of what it needs to thrive, from repotting to pest control. 15 minutes, in person. You'll get the address when you book.",
    "pickUpTitle": "Pick up from your door",
    "pickUpBody": "We collect your plant, take it to the Houseplant Hospital for a full assessment and treatment, then bring it back once it's ready. BS1 to BS9. Free collection for 3 or more plants, or £8 for 1 or 2.",
})

w('src/content/pages/contact.json', {
    "heading": "Get in touch.",
    "intro": "Not sure what your plant needs, or want to ask about something else? Send a message, or WhatsApp if that's easier.",
    "afterMessage": "Thanks for your message. We'll get back to you as soon as we can.",
})

w('src/content/delivery.json', {
    "collect": {"enabled": True, "label": "Collect from the Houseplant Hospital", "note": "We'll message you to arrange a time."},
    "local": {"enabled": True, "label": "Local delivery", "note": "[PLACEHOLDER] Delivered by hand, usually within a week.", "price": 5, "districts": "BS1, BS2, BS3, BS4, BS5, BS6, BS7, BS8, BS9"},
    "courier": {"enabled": False, "label": "Packed and posted, UK", "note": "", "price": 0},
})

about = """---
heading: Hey, I'm Mandie.
portrait: ../../assets/images/pages/mandie.jpg
portraitAlt: Mandie among the hanging plants in her home
values:
  - title: Don't bin it
    body: >-
      [PLACEHOLDER] Most struggling plants can be saved. Before anything goes
      in the compost, let's take a look.
  - title: Pre-loved pots
    body: >-
      Not every pot we use is new. Second-hand ceramics, cleaned up and given
      a new life.
  - title: Find us out and about
    body: >-
      [PLACEHOLDER] Look out for the thrive plant clinic at the Bristol Rare
      Plant and Orchid Fair.
---
I've been campaigning for freedom and human rights in Tibet for over 25 years.

When I hung up my professional campaigning boots a friend suggested I use my greenfingers for good instead.

I've been helping revive friends' houseplants for decades so a move to focus on plants wasn't that strange.

And Bristol's first houseplant hospital was born, in my back garden!

So that's me and this is thrive. If you need help with a plant, get in touch.
"""
with open('src/content/pages/about.mdoc', 'w', encoding='utf-8') as f:
    f.write(about)

products = [
    ("monstera-on-a-moss-pole", "Monstera on a moss pole", 38, "Vintage terracotta pot", "monstera-pole.webp", False, False, "Monstera on a moss pole in a terracotta pot"),
    ("calathea", "Calathea", 26, "Teal glazed ceramic", "calathea-teal.webp", False, True, "Calathea with striped leaves in a teal pot"),
    ("birds-nest-fern", "Bird's nest fern", 22, "Blush pink pot", "fern-pink.webp", False, True, "Bird's nest fern in a pink pot"),
    ("jade-plant", "Jade plant", 34, "Forest green stoneware", "jade-green.webp", True, False, "Jade plant in a dark green pot"),
    ("snake-plant", "Snake plant", 30, "Hand-thrown terracotta", "snake-terracotta.webp", True, False, "Tall snake plant in a terracotta pot"),
    ("aglaonema-red-siam", "Aglaonema 'Red Siam'", 24, "Dusky pink pot", "aglaonema-pink.webp", False, False, "Aglaonema with pink and green leaves in a pink pot"),
    ("zz-plant", "ZZ plant", 28, "Sea green ceramic", "zz-teal.webp", True, False, "ZZ plant in a sea green pot"),
    ("ficus-ginseng", "Ficus ginseng", 20, "Pale blue pot", "bonsai.webp", False, False, "Ficus ginseng with a thick root trunk in a pale blue pot"),
]
os.makedirs('src/content/products', exist_ok=True)
for slug, title, price, pot, img, easy, pet, alt in products:
    with open(f'src/content/products/{slug}.mdoc', 'w', encoding='utf-8') as f:
        f.write(f"""---
title: {json.dumps(title, ensure_ascii=False)}
price: {price}
pot: {pot}
kind: plant-and-pot
easyCare: {str(easy).lower()}
petSafe: {str(pet).lower()}
status: available
images:
  - image: ../../assets/images/products/{img}
    alt: {alt}
placeholder: true
---
[PLACEHOLDER] A sample item made for the preview. Delete it, or replace it with a real plant, before the shop opens.
""")

w('src/content/shop-order.json', {"items": [p[0] for p in products]})
print('Seeded content.')
