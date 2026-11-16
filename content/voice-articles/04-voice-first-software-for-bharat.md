title: Voice-first software for Bharat: five problems worth building for
slug: voice-first-software-for-bharat
topic: culture
dek: Typing is a barrier for a lot of people. Five everyday problems where speaking is the better interface, and what to think about before you build.
---
A lot of software assumes the user can read a small screen, type quickly and write in one language. For a large number of people in India, that assumption does not hold. They may prefer to speak in their own language, or they may be doing something else with their hands. Voice removes that barrier.

Here are five problem areas where a voice-first approach can help, followed by the design questions that matter for each. They are the same five tracks used in the Bolo and Build hackathon.

## 1. Health: understand it and ask for help

Someone leaves a clinic with a prescription they cannot fully read, or a caregiver is trying to describe symptoms in their own words. Useful ideas include reading a prescription out loud in simple language, helping someone describe symptoms before they see a doctor, and finding nearby care.

Think about safety first. A health tool should explain and help people prepare. It should not diagnose, and it should point people toward a qualified professional.

## 2. Farmers: advice at the speed of speech

A farmer in the field may have muddy hands and a basic phone. Questions are practical: what is the price today, will it rain this week, what should I do about this pest. A voice-first tool that answers in a local language and understands local crop names could be genuinely useful.

Think about data. Useful answers depend on reliable price and weather sources, and the app needs to say plainly when it does not know.

## 3. Learning: a tutor in every classroom

Students in smaller towns often have fewer resources and more crowded classrooms. Teachers need help with lesson plans and revision material. A tool that lets a student ask a question out loud and get a patient, clear answer in their language lowers the barrier a lot.

Think about accuracy and tone. Explanations must be correct, and they should encourage the student to understand rather than copy.

## 4. Small business: run a shop by talking

A shopkeeper with ten customers waiting does not have time to type. Billing, stock and tax records are all things they could handle by saying "two kilos of rice, one packet of tea" and getting a correct bill.

Think about speed and correction. The tool has to be fast, and it has to make it easy to fix a mistake without starting again.

## 5. Citizens: schemes, forms and complaints

Many people miss out on government schemes simply because finding and filling in the forms is hard. A voice tool could help someone discover what they qualify for, fill in a form step by step, or file a complaint clearly.

Think about privacy. These forms contain sensitive personal details, so decide early what you store, for how long, and how you tell the user.

## Design questions that apply to all five

- **Which languages?** Start with the languages your users really speak, and test with real accents, not just a clean studio voice.
- **Mixed languages.** People often switch between languages in one sentence. Test for that, because it breaks many speech systems.
- **Noise.** Markets, buses and fields are loud. Test in noisy conditions, not only in a quiet room.
- **Low connectivity.** Plan for slow or unreliable networks and for older, cheaper phones.
- **Trust.** Confirm before doing anything that matters, such as submitting a form or sending money.
- **Fallback.** Always give a way to type or tap when speech fails.

## Where to start

Pick one person and one task. "A kirana owner who wants a bill in under ten seconds" is a better starting point than "billing for small businesses". A narrow problem lets you build something that works, test it with a real user, and improve it.
