import { config, collection, singleton, fields } from '@keystatic/core';

/* ============================================================
   KEYSTATIC — Mandie's editing screen, at /keystatic.

   Written for someone who has never used a CMS. Two rules throughout:

   1. Every field has a description in plain English saying what it does.
   2. Nothing that would break the site is editable. Layout, colour and
      order of sections stay in code; words, photos, prices and
      availability are hers.

   STORAGE: local while developing (writes straight to disk, no login), and
   GitHub once deployed, where saving makes a commit and Cloudflare rebuilds
   the site in about a minute. The repo below is a placeholder until the
   GitHub account exists. See SETUP.md.

   Every image field writes into src/assets, not public/, so Astro resizes it
   at build time. `publicPath` is relative to the content file that stores
   it, which is why it differs between pages and products.
   ============================================================ */

const pageImage = (label: string, description?: string) =>
  fields.image({
    label,
    description:
      description ??
      'Send it at full size, straight from your phone. The website shrinks every photo for whoever is looking, so a big file will not slow it down.',
    directory: 'src/assets/images/pages',
    publicPath: '../../assets/images/pages/',
  });

/* Icons she can choose for lists like the symptom grid. A short named list
   rather than a free-text box: an icon name typed wrong would show nothing,
   and she would have no way of knowing why. */
const iconOptions = [
  { label: 'Leaf', value: 'leaf' },
  { label: 'Bug', value: 'bug' },
  { label: 'Bug with a line through it', value: 'bug-off' },
  { label: 'Water drops', value: 'droplets' },
  { label: 'Glass of water', value: 'glass-water' },
  { label: 'Spade', value: 'shovel' },
  { label: 'Sun', value: 'sun' },
  { label: 'Wind', value: 'wind' },
  { label: 'Flame', value: 'flame' },
  { label: 'Arrow down', value: 'arrow-down' },
  { label: 'Arrows outwards', value: 'maximize-2' },
  { label: 'Heartbeat', value: 'heart-pulse' },
  { label: 'Sprout', value: 'sprout' },
  { label: 'Briefcase', value: 'briefcase' },
  { label: 'Knife and fork', value: 'utensils-crossed' },
  { label: 'Coffee cup', value: 'coffee' },
  { label: 'Shop front', value: 'store' },
  { label: 'House', value: 'house' },
];

const step = (label: string) =>
  fields.object(
    {
      title: fields.text({ label: 'Title' }),
      body: fields.text({ label: 'Text', multiline: true }),
    },
    { label },
  );

const listOf = (label: string, item: Parameters<typeof fields.array>[0], description?: string) =>
  fields.array(item, {
    label,
    description,
    itemLabel: (props: any) => props.fields?.title?.value || props.fields?.label?.value || props.fields?.name?.value || props.fields?.question?.value || label,
  });

export default config({
  storage: import.meta.env.DEV
    ? { kind: 'local' }
    : {
        kind: 'github',
        /* [PLACEHOLDER] until the GitHub account exists. */
        repo: { owner: 'REPLACE-WITH-GITHUB-OWNER', name: 'thrive-plants-site' },
      },

  ui: {
    brand: { name: 'thrive plants bristol' },
    /* By page of the website, in the order of the site's own menu. */
    navigation: {
      Home: ['homePage'],
      'Plant Hospital': ['hospitalPage'],
      Shop: ['shopPage', 'products', 'shopOrder', 'delivery'],
      'For Business': ['businessPage'],
      'Gift Vouchers': ['vouchersPage'],
      About: ['aboutPage'],
      'Book in': ['bookPage'],
      Contact: ['contactPage'],
      'On every page': ['settings'],
      'Small print': ['privacy', 'returns'],
    },
  },

  collections: {
    products: collection({
      label: 'Plants and pots for sale',
      path: 'src/content/products/*',
      slugField: 'title',
      format: { contentField: 'details' },
      entryLayout: 'content',
      columns: ['title', 'price', 'status'],
      schema: {
        title: fields.slug({
          name: { label: 'Name', validation: { length: { min: 1 } } },
          slug: {
            label: 'Web address',
            description: 'The end of this item’s link. Changing it breaks any link to it you have already shared.',
          },
        }),
        price: fields.number({
          label: 'Price in pounds',
          description: 'For example 24, or 24.50. No £ sign.',
          validation: { isRequired: true, min: 1 },
        }),
        pot: fields.text({
          label: 'About the pot',
          description: 'One short line shown under the name. For example: Vintage terracotta pot.',
        }),
        kind: fields.select({
          label: 'What is it',
          options: [
            { label: 'Plant in a pot', value: 'plant-and-pot' },
            { label: 'Pot on its own', value: 'pot' },
            { label: 'Plant on its own', value: 'plant' },
            { label: 'Something else', value: 'other' },
          ],
          defaultValue: 'plant-and-pot',
        }),
        easyCare: fields.checkbox({ label: 'Show an “Easy care” badge' }),
        petSafe: fields.checkbox({
          label: 'Show a “Pet safe” badge',
          description: 'Only tick this if you are sure. People will rely on it.',
        }),
        status: fields.select({
          label: 'Availability',
          description:
            'Things sold through the website are marked as rehomed automatically. Use this for anything you sell another way, such as at a fair, or to take something off the shop without deleting it.',
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Rehomed (sold)', value: 'sold' },
            { label: 'Hidden from the shop', value: 'hidden' },
          ],
          defaultValue: 'available',
        }),
        images: fields.array(
          fields.object({
            image: fields.image({
              label: 'Photo',
              description: 'Full size from your phone is perfect. A plain wall behind it works best.',
              directory: 'src/assets/images/products',
              publicPath: '../../assets/images/products/',
              validation: { isRequired: true },
            }),
            alt: fields.text({
              label: 'Describe the photo',
              description: 'For people who cannot see it. For example: Snake plant in a terracotta pot, from the front.',
            }),
          }),
          {
            label: 'Photos',
            description: 'The first photo is the one the shop shows. Drag to reorder.',
            itemLabel: (props) => props.fields.alt.value || 'Photo',
            validation: { length: { min: 1 } },
          },
        ),
        placeholder: fields.checkbox({
          label: 'Sample item',
          description: 'Ticked on the example items made for the preview. Delete these before the shop opens.',
        }),
        details: fields.markdoc({
          label: 'More about it',
          description: 'Shown on the item’s own page. Care tips, size, where the pot came from.',
        }),
      },
    }),
  },

  singletons: {
    /* The small print. Singletons, so the file only exists once she saves it:
       until then /privacy and /returns are 404s and the footer has no link. */
    privacy: singleton({
      label: 'Privacy policy',
      path: 'src/content/legal/privacy',
      format: { contentField: 'body' },
      schema: {
        title: fields.text({ label: 'Page heading', defaultValue: 'Privacy policy' }),
        navLabel: fields.text({ label: 'Footer link text', defaultValue: 'Privacy' }),
        order: fields.integer({ label: 'Position in the footer', defaultValue: 1 }),
        body: fields.markdoc({ label: 'Policy' }),
      },
    }),
    returns: singleton({
      label: 'Delivery and returns',
      path: 'src/content/legal/returns',
      format: { contentField: 'body' },
      schema: {
        title: fields.text({ label: 'Page heading', defaultValue: 'Delivery and returns' }),
        navLabel: fields.text({ label: 'Footer link text', defaultValue: 'Delivery and returns' }),
        order: fields.integer({ label: 'Position in the footer', defaultValue: 2 }),
        body: fields.markdoc({ label: 'Terms' }),
      },
    }),
    settings: singleton({
      label: 'Contact details and links',
      path: 'src/content/settings',
      format: 'json',
      schema: {
        tagline: fields.text({ label: 'Short line under the logo in the footer' }),
        description: fields.text({
          label: 'Description for Google and link previews',
          description: 'One or two sentences. Used when a page is shared or shows up in a search.',
          multiline: true,
        }),
        whatsapp: fields.url({ label: 'WhatsApp link' }),
        instagram: fields.url({ label: 'Instagram link' }),
        email: fields.text({
          label: 'Email address to show on the site',
          description: 'Leave empty to show no email address anywhere.',
        }),
        serviceArea: fields.text({ label: 'Where you collect and deliver', description: 'For example: BS1 to BS9.' }),
        calUser: fields.text({
          label: 'Your cal.com username',
          description: 'The bit after cal.com/ in your booking link.',
        }),
        dropOffEvent: fields.text({ label: 'cal.com drop-off event', description: 'The bit after your username in the drop-off link.' }),
        pickUpEvent: fields.text({ label: 'cal.com pick-up event', description: 'The bit after your username in the pick-up link.' }),
        shareImage: fields.image({
          label: 'Picture for link previews',
          description: 'Shown when someone shares the website on WhatsApp, Facebook and so on. Landscape works best.',
          directory: 'src/assets/images/pages',
          publicPath: '../assets/images/pages/',
        }),
        shareImageAlt: fields.text({ label: 'Describe that picture' }),
      },
    }),

    homePage: singleton({
      label: 'Home page',
      path: 'src/content/pages/home',
      format: 'json',
      schema: {
        heroLine1: fields.text({ label: 'Big headline, first line' }),
        heroLine2: fields.text({ label: 'Big headline, second line', description: 'Shown in green.' }),
        heroLead: fields.text({ label: 'Text under the headline', multiline: true }),
        heroImage: pageImage('Big photo behind the headline', 'A tall or square photo works best. The top of the photo is what shows on phones.'),
        stepsHeading: fields.text({ label: 'How it works: heading' }),
        steps: listOf('How it works: steps', step('Step')),
        symptomsHeading: fields.text({ label: 'Symptom grid: heading' }),
        symptomsIntro: fields.text({ label: 'Symptom grid: intro', multiline: true }),
        symptoms: listOf(
          'Symptom grid: squares',
          fields.object(
            {
              label: fields.text({ label: 'Text' }),
              icon: fields.select({ label: 'Icon', options: iconOptions, defaultValue: 'leaf' }),
            },
            { label: 'Square' },
          ),
          'The last square is shown highlighted, like the winning square in your bingo post.',
        ),
        servicesHeading: fields.text({ label: 'Services: heading' }),
        services: listOf(
          'Services: cards',
          fields.object(
            {
              title: fields.text({ label: 'Title' }),
              body: fields.text({ label: 'Text', multiline: true }),
              link: fields.text({ label: 'Link to', description: 'A page on this site, for example /shop.' }),
              linkLabel: fields.text({ label: 'Link text' }),
              image: pageImage('Photo'),
            },
            { label: 'Card' },
          ),
        ),
        patientsHeading: fields.text({ label: 'Recent patients: heading' }),
        patients: listOf(
          'Recent patients',
          fields.object(
            {
              title: fields.text({ label: 'Plant' }),
              note: fields.text({ label: 'What you did', multiline: true }),
              image: pageImage('Photo'),
              placeholder: fields.checkbox({ label: 'Sample', description: 'Ticked on the examples. Replace with your own before and afters.' }),
            },
            { label: 'Patient' },
          ),
        ),
        aboutEyebrow: fields.text({ label: 'About section: small heading' }),
        aboutHeading: fields.text({ label: 'About section: heading' }),
        aboutBody: fields.text({ label: 'About section: text', multiline: true }),
        aboutImage: pageImage('About section: photo'),
      },
    }),

    hospitalPage: singleton({
      label: 'Plant Hospital page',
      path: 'src/content/pages/hospital',
      format: 'json',
      schema: {
        heading: fields.text({ label: 'Heading' }),
        intro: fields.text({ label: 'Intro', multiline: true }),
        dropOff: fields.text({ label: 'Drop off: text', multiline: true }),
        pickUp: fields.text({ label: 'Pick up: text', multiline: true }),
        treatmentsHeading: fields.text({ label: 'Treatments: heading' }),
        treatments: listOf(
          'Treatments and prices',
          fields.object(
            {
              name: fields.text({ label: 'Treatment' }),
              description: fields.text({ label: 'Short description' }),
              price: fields.text({ label: 'Price', description: 'Written however you like: From £8, or On assessment.' }),
            },
            { label: 'Treatment' },
          ),
        ),
        treatmentsNote: fields.text({ label: 'Small print under the prices' }),
        careCard: fields.object(
          {
            plant: fields.text({ label: 'Plant' }),
            light: fields.text({ label: 'Light' }),
            water: fields.text({ label: 'Water' }),
            feed: fields.text({ label: 'Feed' }),
            treated: fields.text({ label: 'Treated for' }),
          },
          { label: 'Example care card', description: 'The sample card shown on the page.' },
        ),
        faqs: listOf(
          'Questions and answers',
          fields.object(
            {
              question: fields.text({ label: 'Question' }),
              answer: fields.text({ label: 'Answer', multiline: true }),
            },
            { label: 'Question' },
          ),
        ),
        image: pageImage('Photo'),
      },
    }),

    shopPage: singleton({
      label: 'Shop page',
      path: 'src/content/pages/shop',
      format: 'json',
      schema: {
        heading: fields.text({ label: 'Heading' }),
        intro: fields.text({ label: 'Intro', multiline: true }),
        comingSoon: fields.checkbox({
          label: 'Shop is not open yet',
          description: 'While ticked, people can see the items but cannot buy them. Untick when you are ready to sell.',
          defaultValue: true,
        }),
        promises: listOf('Three promises under the shop', step('Promise')),
        emptyBasket: fields.text({ label: 'What the basket says when it is empty' }),
        afterOrder: fields.text({ label: 'What people see after they have paid', multiline: true }),
      },
    }),

    shopOrder: singleton({
      label: 'Shop order',
      path: 'src/content/shop-order',
      format: 'json',
      schema: {
        items: fields.array(fields.relationship({ label: 'Item', collection: 'products' }), {
          label: 'Order of items in the shop',
          description: 'Drag to reorder. Anything not in this list goes at the end, so nothing can go missing.',
          itemLabel: (props) => props.value || 'Choose an item',
        }),
      },
    }),

    delivery: singleton({
      label: 'Collection and delivery',
      path: 'src/content/delivery',
      format: 'json',
      schema: {
        collect: fields.object(
          {
            enabled: fields.checkbox({ label: 'Offer collection', defaultValue: true }),
            label: fields.text({ label: 'Name', defaultValue: 'Collect from the Houseplant Hospital' }),
            note: fields.text({ label: 'Note', description: 'For example: We will message you to arrange a time.' }),
          },
          { label: 'Collection' },
        ),
        local: fields.object(
          {
            enabled: fields.checkbox({ label: 'Offer local delivery', defaultValue: true }),
            label: fields.text({ label: 'Name', defaultValue: 'Local delivery' }),
            note: fields.text({ label: 'Note' }),
            price: fields.number({ label: 'Price in pounds', description: '0 for free.', defaultValue: 0 }),
            districts: fields.text({
              label: 'Postcodes you deliver to',
              description: 'The first part of the postcode, separated by commas. For example: BS1, BS2, BS3.',
            }),
          },
          { label: 'Local delivery' },
        ),
        courier: fields.object(
          {
            enabled: fields.checkbox({ label: 'Offer packed and posted delivery', defaultValue: false }),
            label: fields.text({ label: 'Name', defaultValue: 'Packed and posted, UK' }),
            note: fields.text({ label: 'Note' }),
            price: fields.number({ label: 'Price in pounds', defaultValue: 0 }),
          },
          { label: 'Packed and posted (UK)', description: 'Switched off until you decide whether to post plants.' },
        ),
      },
    }),

    businessPage: singleton({
      label: 'For Business page',
      path: 'src/content/pages/business',
      format: 'json',
      schema: {
        heading: fields.text({ label: 'Heading' }),
        intro: fields.text({ label: 'Intro', multiline: true }),
        image: pageImage('Photo'),
        imageAlt: fields.text({ label: 'Describe the photo' }),
        offers: listOf('What you offer', step('Offer')),
        whoHeading: fields.text({ label: 'Who it is for: heading' }),
        who: listOf(
          'Who it is for',
          fields.object(
            {
              label: fields.text({ label: 'Text' }),
              icon: fields.select({ label: 'Icon', options: iconOptions, defaultValue: 'briefcase' }),
            },
            { label: 'Type of business' },
          ),
        ),
        formHeading: fields.text({ label: 'Enquiry form: heading' }),
        formIntro: fields.text({ label: 'Enquiry form: intro', multiline: true }),
      },
    }),

    vouchersPage: singleton({
      label: 'Gift Vouchers page',
      path: 'src/content/pages/vouchers',
      format: 'json',
      schema: {
        heading: fields.text({ label: 'Heading' }),
        intro: fields.text({ label: 'Intro', multiline: true }),
        amounts: fields.array(fields.integer({ label: 'Amount in pounds', validation: { min: 1 } }), {
          label: 'Voucher amounts',
          description: 'Whole pounds. These are the only amounts people can buy.',
          itemLabel: (props) => (props.value ? `£${props.value}` : 'Amount'),
        }),
        points: fields.array(fields.text({ label: 'Point' }), {
          label: 'Small points under the form',
          itemLabel: (props) => props.value || 'Point',
        }),
        afterOrder: fields.text({ label: 'What people see after buying a voucher', multiline: true }),
      },
    }),

    aboutPage: singleton({
      label: 'About page',
      path: 'src/content/pages/about',
      format: { contentField: 'story' },
      entryLayout: 'content',
      schema: {
        heading: fields.text({ label: 'Heading' }),
        portrait: pageImage('Photo of you'),
        portraitAlt: fields.text({ label: 'Describe the photo' }),
        values: listOf('Three things under your story', step('Point')),
        story: fields.markdoc({ label: 'Your story' }),
      },
    }),

    bookPage: singleton({
      label: 'Book in page',
      path: 'src/content/pages/book',
      format: 'json',
      schema: {
        heading: fields.text({ label: 'Heading' }),
        intro: fields.text({ label: 'Intro', multiline: true }),
        dropOffTitle: fields.text({ label: 'Drop off: title' }),
        dropOffBody: fields.text({ label: 'Drop off: text', multiline: true }),
        pickUpTitle: fields.text({ label: 'Pick up: title' }),
        pickUpBody: fields.text({ label: 'Pick up: text', multiline: true }),
      },
    }),

    contactPage: singleton({
      label: 'Contact page',
      path: 'src/content/pages/contact',
      format: 'json',
      schema: {
        heading: fields.text({ label: 'Heading' }),
        intro: fields.text({ label: 'Intro', multiline: true }),
        afterMessage: fields.text({ label: 'What people see after sending a message', multiline: true }),
      },
    }),
  },
});
