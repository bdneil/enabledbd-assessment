/* Lead capture and PDF are handled server-side by the serverless functions
   in /netlify/functions. The old Google Sheet endpoint lives there now (kept
   off the client). API_BASE is same-origin in production; override only if you
   ever host the functions on a different domain. */
const API_BASE = "";

/* Launch config (§4). Flip SOURCE to 'live' at public launch, everything before
   that is 'tester' and must be excluded from population stats. Turn SHOW_POP_STAT
   on only once >=250 'live' rows exist; it ships dark. */
const SOURCE = 'live';
const INSTRUMENT = 'v4';
const SHOW_POP_STAT = false;
const POP_STAT_PCT = { connector:'', driver:'', educator:'', powerhouse:'' }; // filled when live data clears the floor

/* Outbound links + contact (edit these, not the markup). */
const CONTACT_EMAIL = 'neil@enabledbd.com';
const PODCAST_URL   = 'https://www.youtube.com/channel/UCdR27kr5kwGS0d55tgbKbyg';
const LINKEDIN_URL  = 'https://www.linkedin.com/in/neil-barrow/';
const PRIVACY_URL   = 'https://enabledbd.com/privacy-policy/';   // set to '' to hide the gate Privacy link
/* Instrument disclaimer, shown at the bottom of the summary (web) and in the playbook What's Next (web + PDF). */
const DISCLAIMER_TEXT = "This is a self-assessment built from years of working with professional-services firms, a planning tool, not a validated psychometric instrument, and not professional advice. It's your starting point, not a verdict.";
/* Short third-person lines for the "three styles" comparison strip on the result page. */
const COMPARE_LINE = {
  connector:"Grows business through people, the intros, the coffees, the relationships.",
  driver:"Grows business by opening doors, starting the conversation and making the ask.",
  educator:"Grows business by being known for what they know, ideas that pull the right people in."
};

/* EnabledBD brand mark (reconstructed as vector so it stays crisp in the PDF):
   two-tone green spire encircled by the gray ring. */
const BRANDMARK=(s)=>`<svg viewBox="0 0 100 100" width="${s}" height="${s}" aria-hidden="true" style="display:inline-block;vertical-align:middle"><polygon points="50,12 33,86 50,70" fill="#14541c"/><polygon points="50,12 67,86 50,70" fill="#8cac8c"/><ellipse cx="50" cy="55" rx="27" ry="8.5" fill="none" stroke="#a6a6a6" stroke-width="2.6" transform="rotate(-7 50 55)"/></svg>`;

const EXT={
  connector:{name:"The Connector",pillar:"Referral",color:"#346438",tag:"You grow business through people.",blurb:"You're energized by people, the coffee, the catch-up, the introduction. You'd rather have conversations than write, and you'd take an opportunity to meet new people than send a cold email. The challenge is maintaining and deepening those right relationships as a trusted advisor. As Tim Ferriss put it, cultivate the intense few instead of the lukewarm many."},
  driver:{name:"The Driver",pillar:"Prospect",color:"#64846c",tag:"You grow business by opening doors.",blurb:"You go after it. Asking for the work doesn't rattle you, waiting for business to find you feels like losing. You'd rather get new at-bats with potential clients than glad-handing at a networking reception or writing a white paper. The challenge is converting those at-bats with new prospective clients by consulting to the why, not the how."},
  educator:{name:"The Educator",pillar:"Brand",color:"#a6a6a6",tag:"You grow business by being known for what you know.",blurb:"You'd rather put your thinking into the world than work a room. Writing something that lands with the right fifty people beats fifty handshakes at a reception, and you'll take one great conversation over ten introductions. The challenge is doing this consistently to build your personal brand around your point of view that converts, eyeballs aren't pipeline until you follow up."}
};
const POWER={name:"The Powerhouse",color:"#14541c",tag:"You operate naturally across every pillar.",blurb:"You move comfortably across deepening clients, working a network, pursuing opportunities, and building your profile, on a solid foundation. Your one risk is spreading thin; the discipline you need is focus."};

const OWNER_ZONES=[
  {key:"craftsperson",name:"The Craftsperson",desc:"Your work is your reputation, the classic 'do good work and the clients will come'.",next:"The challenge here is that great work alone isn't a growth plan. The good news: a little intention with the clients you already have goes a long way. So the next activity is to start being proactive with the clients you already serve."},
  {key:"dependable",name:"The Dependable",desc:"Clients rely on you and keep coming back, you're steady, responsive, the one they trust.",next:"The challenge here is you're reactive, not yet proactive. So the next activity is to give clients a reason to hear from you beyond the work, an article, an introduction, a heads-up."},
  {key:"builder",name:"The Relationship-Builder",desc:"You're genuinely close to your clients and they trust you, that trust is a real client foundation.",next:"The challenge here is that trust isn't working as hard as it could yet. So the next activity is to get intentional, pick where you invest, and start growing those relationships on purpose."},
  {key:"advisor",name:"The Intentional Advisor",desc:"You actively deepen client relationships and look for ways to add value, this is the real work of client development, and you're doing it.",next:"The challenge here is that good is the enemy of great. So the next activity is to get ahead of them, anticipate what they'll need before they ask, and start extending into the pillar your style points toward."},
  {key:"partner",name:"The Growth Partner",desc:"You're woven into your clients' success, and you treat the relationship as a deliberate engine for growth.",next:"Your client and internal foundation is a genuine strength. So the next activity is to extend it, expand more intentionally into your pillars of strength and keep growing."}
];
const BUILDER_ZONES=[
  {key:"headsdown",name:"Heads-Down",desc:"You're focused on getting genuinely good at the work, early on, that's exactly the right priority.",next:"The challenge here is that good work no one sees doesn't open doors. So the next activity is to let a few of the right people see it, start with one."},
  {key:"contributor",name:"Trusted Contributor",desc:"You do strong work and people like working with you, you're reliable, and people ask for you.",next:"The challenge here is you're close to the work but not yet to how it gets won or clients are grown. So the next activity is to get nearer that, sit in on a pitch, a proposal, a client conversation."},
  {key:"aware",name:"Relationship-Aware",desc:"You build real rapport, and you're starting to notice how BD actually happens around you.",next:"The challenge here is you're watching it happen, not yet driving it. So the next activity is to start building your own network, internally and externally, on purpose."},
  {key:"emerging",name:"Emerging Developer",desc:"Your opportunity is to be intentional, building internal relationships, your own network, and getting into the room where the conversations happen.",next:"The challenge with Emerging Developer is you're still building the foundation, and we need to start simply. So the next activity is to take ownership of building your relationships, internally and externally."},
  {key:"rising",name:"Rising Rainmaker",desc:"You're actively building relationship capital inside and out, and contributing to BD before anyone's made you, rare this early.",next:"You're laying a real foundation early. So the next activity is to take ownership of one relationship or engagement end to end, and lean into the pillar your style points toward."}
];

const OWNER_MOVE={craftsperson:"Pick your three most important clients and reach out to one this week about something beyond their current work.",dependable:"Choose one steady client and give them something useful they didn't ask for: an article, an introduction, a heads-up.",builder:"Pick one trusted client and have the bigger conversation: where's their business headed, and how could you help beyond your current scope?",advisor:"Map your top relationships and find one where you could expand the work, then put it on the table.",partner:"Choose one strong client to turn into an active referral and advocacy relationship."};
const BUILDER_MOVE={headsdown:"Pick one partner whose work you admire and make sure they see your best work this month.",contributor:"Volunteer for one thing close to how work gets won (a pitch, a proposal, a client meeting) and ask to be included.",aware:"Reconnect with two peers or alumni who are building their careers alongside you.",emerging:"Ask a partner if you can sit in on a client-development conversation and watch how they do it.",rising:"Take ownership of one small relationship or BD initiative end to end."};
const STYLE_FLAVOR={connector:"As you do, look for someone to introduce them to. Be the connector you are.",driver:"Go in with one specific idea for what else they might need help with.",educator:"Bring a relevant insight or piece of your thinking to share."};
const EXT_MOVE_OWNER={connector:"Name your 5–10 most valuable referral relationships (this becomes your focus list) and reconnect with one this week.",driver:"Pick one person in your orbit you'd genuinely like to work with and generate a conversation.",educator:"Write one short piece on a question your clients keep asking, and send it directly to a few people.",power:"Pick ONE pillar to push this quarter (clients, referral sources, prospective clients, or brand): get organized and go deep."};
const EXT_MOVE_BUILDER={connector:"Build your peer network, reconnect with three people from school or connections you've made.",driver:"Put your hand up for the next pitch or proposal or prospective client meeting and ask to play a real role.",educator:"Write one short post on something you've learned, start building a point of view.",power:"Pick one BD muscle to build this quarter - focus your effort by asking 'where am I already getting results that I could go deeper on?'."};

/* ---- summary copy (content as data) ---- */
const SUMMARY={
  fnd:{
    craftsperson:"your work is your reputation, and it's strong, you've earned trust by being genuinely good at what you do",
    dependable:"clients rely on you and keep coming back, you're the steady, responsive one they trust",
    builder:"you're genuinely close to the clients you serve, and that trust is a real client foundation",
    advisor:"you actively deepen client relationships and look for ways to add value, the real work of client development",
    partner:"you treat your client relationships as a deliberate engine for growth, and it shows",
    headsdown:"right now you're focused on getting genuinely good at the work, exactly the right priority this early",
    contributor:"you do strong work and people like working with you, you're reliable, and people ask for you",
    aware:"you build real rapport, and you're starting to notice how business development actually happens around you",
    emerging:"you're already intentional, building relationships inside and out, and getting yourself into the room",
    rising:"you're building real relationship capital, inside and out, before anyone's made you do it, rare this early"
  },
  styleOut:{
    connector:"When you reach beyond that foundation, you do it through people, you're a natural Connector, the one who builds and works a web of relationships.",
    driver:"When you reach beyond that foundation, you go and get it, you're a Driver, comfortable starting the conversation and making the ask most people avoid.",
    educator:"When you reach beyond that foundation, you lead with your thinking, you're an Educator, the one people seek out for what you know."
  },
  styleIn:{
    connector:"And when you do reach out, your instinct is toward people, there's a Connector in you, even if that muscle is still warming up.",
    driver:"And when you do reach out, your instinct is to go get it, there's a Driver in you, even if it's early days.",
    educator:"And when you do reach out, your instinct is to lead with what you know, there's an Educator in you, waiting for reps."
  },
  power:"And you don't stay in one lane, you move comfortably across deepening clients, working a network, chasing opportunities, and building your profile. That range is your real asset; your only risk is spreading it too thin.",
  powerBuilder:"And you don't stay in one lane, this early, you're already moving across internal relationships, chasing the room, and building a profile. That range is genuinely rare this soon, and it's a real asset; the risk is spreading thin before anything has the chance to compound.",
  bat:{
    charged:"And it seems like you've got the appetite and the room to stretch a little.",
    steady:"Your capacity is steady right now, so the answer isn't more hustle, it's being a bit more deliberate with what you've already got.",
    low:"Your plate is full right now, so the smart play is less, not more. One small thing you'll actually keep up beats a plan you won't."
  }
};
function batLevel(b){return b>=66?'charged':(b>=38?'steady':'low');}
const EXT_COLOR_OWNER={
  connector:"You already know who they are: the people who've sent you work before, or easily could. You don't need a system for this, just the list and a coffee. That's where we start.",
  driver:"There's a name you've been meaning to call, someone you'd genuinely like to work with but haven't reached out to yet. You don't need a reason, just an opener. That's where we start.",
  educator:"Think of the question you answer on every call, the one you could explain in your sleep. That's your first piece. You're not writing a book, just what you already know. That's where we start.",
  power:"You can already do all four, that's never been the question. The question is which one gets your real attention this quarter. Pick the one you've been circling. That's where we start."
};
const EXT_COLOR_BUILDER={
  connector:"You know you have people in your network (or your cell phone) you haven't caught up with in a while, or ever. That's where we start.",
  driver:"There's a pitch or proposal coming up, there always is. You don't have to lead it, just get in the room and own one real piece. That's where we start.",
  educator:"You learned something this month that clicked, a lesson, a fix, a 'that's actually useful.' That's the post. Nobody's expecting a manifesto, just your take. That's where we start.",
  power:"You're the rare one who's comfortable across all of it, which is exactly why the trap is a little of everything. Pick the one already showing results and lean in. That's where we start."
};
function buildSynth(r){
  const fnd=SUMMARY.fnd[r.zone.key]||r.zone.desc;
  const fndCap=fnd.charAt(0).toUpperCase()+fnd.slice(1);
  let style = r.integrated?(r.track==='builder'?SUMMARY.powerBuilder:SUMMARY.power):(r.foundationLed?SUMMARY.styleIn[r.primary]:SUMMARY.styleOut[r.primary]);
  return `${fndCap}. ${style} ${SUMMARY.bat[batLevel(r.battery)]}`;
}
function styleHeadline(r){return r.integrated?'Powerhouse':EXT[r.primary].name.replace('The ','');}
function styleArticle(s){return /^[AEIOU]/.test(s)?'an':'a';}
function zoneName(n){return (n||'').replace(/^The /,'');}   // zone names never render with "The"
function level3(v){return v>=66?'High':(v>=38?'Moderate':'Low');}
function signatureLine(r){
  // One format for both tracks, foundation always named (item 7).
  const style=styleHeadline(r), zone=r.zone.name.replace('The ','');
  const found=r.track==='builder'?'team-and-client foundation':'client foundation';
  return `${style} · ${zone} ${found} · ${level3(r.battery)} battery`;
}
/* Directional blend of the three style scores, no numbers, primary emphasized.
   Powerhouse shows three even bars with a caption instead of a tallest bar. */
function blendBars(r){
  const styles=['connector','driver','educator'];
  const rows=styles.map(k=>{
    const isPrimary=!r.integrated && k===r.primary;
    const w=Math.max(9,r.radar[k]);                    // floor so muted bars still read
    const col=(r.integrated||isPrimary)?EXT[k].color:'#d3d6cc';
    const nm=EXT[k].name.replace('The ','');
    return `<div class="blendrow"><div class="blendlab${isPrimary?' on':''}"${isPrimary?` style="color:${EXT[k].color}"`:''}>${nm}</div><div class="blendtrack"><i style="width:${w}%;background:${col}"></i></div></div>`;
  }).join('');
  return `<div class="blend">${rows}${r.integrated?`<p class="figcap">No single lean, you operate across all three.</p>`:''}</div>`;
}
function buildFramework(r){
  const builder=r.track==='builder';
  const model = builder
    ? `Let's back up and talk about how BD works. Most professional services firms grow through current clients, referrals, and word of mouth, and the habits that get you there start now. Picture it as a foundation with two pillars, inside one orbit. This early, your foundation is relationship capital, the partners and peers who see your work, inside the firm and out, because the people who see your work are the ones who open doors. The two pillars, referral sources and prospects, get built on top of that as you grow, and your style points at the one you lean toward. Around all of it is your brand: being known for what you know, so opportunity can find you.`
    : `Let's back up and talk about how BD works. Most professional services firms grow through current clients, referrals, and word of mouth. So growth comes down to being intentional: deepen the relationships you already have, and grow the right new ones. Picture it as a foundation with two pillars, inside one orbit. Your clients are the foundation, the most reliable growth comes from the relationships you're already in, so that's where everyone starts. The two pillars are your referral sources and your prospects; your style points at the one you lean toward. Around all of it is your brand, the reputation that makes every one of those relationships easier.`;
  const twoJobs = builder
    ? `Your profile does two jobs: it tells you whether you need to step up with the people who see your work, and which pillar you'll grow into next. The panels below show where you land on each.`
    : `Your profile does two jobs: it tells you whether you need to step up with your clients, and which pillar to expand into next. The panels below show where you land on each.`;
  return [model, twoJobs];
}
function buildPriority(r){
  if(r.integrated) return ["Your one job right now","Pick one pillar and go deep this quarter. Your range is rare, focus is what turns it into real results. Consistency on one beats a little of everything."];
  const low=r.maturity<60;
  if(r.foundationLed||low) return ["Where to put your energy first", r.track==='builder'
    ? "Let's strengthen your team-and-client foundation first, the internal relationships, the visibility, the reps everything else stands on. We build that, and extend in tandem as it grows."
    : "Let's make the client relationships you already have more intentional, that's where your next work is most likely to come from. We start there, and extend from it."];
  return ["Where to put your energy first",`Your ${r.track==='builder'?'team-and-client':'client'} foundation is solid ${r.track==='builder'?'(and still worth strengthening)':'(but you can always improve proactivity)'}, so in tandem you can extend into ${EXT[r.primary].pillar}, the pillar your style naturally points toward.`];
}

/* ===================== PLAYBOOK (Pass 2) ===================== */
const PREFACE={
  intro:[
    "Most professionals have been handed a story about business development that isn't true, that it belongs to the naturals, the extroverts, the ones who light up in a room full of strangers. That story keeps good people on the sidelines, certain that BD just isn't for them.",
    "Here's the truer version. Business development isn't a personality you're born with. It's a set of skills and habits you build over time, and like any skill, it grows when you practice it in a way that fits you, and stalls when you try to force yourself into someone else's playbook.",
    "Let's be honest about the real problem: for most of us, it's effort. The business development that should be happening just isn't, it keeps sliding to the bottom of the list behind the client work that always feels more urgent. That's not a character flaw. It's that no one ever made BD simple for you. It gets framed as a big, vague, intimidating thing, so it's easy to keep putting off, and the longer you do, the bigger it looms.",
    "That's what this is here to fix: to make business development simple enough, and clear enough about where to start, that you actually do it, a little, consistently. It's a skill, and skills grow with reps. We're not going to hand you someone else's playbook or ask you to become a different person. But we are going to stretch you, a few things in here will feel uncomfortable at first, and that's the work. We start with the foundation and the basics, and we build. Mostly it comes down to one question: where do you focus your limited time? That's what we're solving."
  ],
  pyramidLead:{
    owner:"It helps to picture business development as a foundation with two pillars standing on it, inside one orbit. Your clients are the foundation, the most reliable growth comes from the relationships you're already in, so that's where everyone needs to focus. The two pillars are your referral sources and your prospects; your style will point at which one you naturally lean to, and plenty of people grow an entire practice on the foundation and one pillar. Around all of it is your brand, the reputation that makes every one of those relationships easier to build.",
    builder:"It helps to picture business development as a foundation with two pillars standing on it, inside one orbit. This early, your foundation is relationship capital, the partners and peers who see your work, inside the firm and out. Early on, the people who see your work are the ones who open doors, so that's where we start. The two pillars, referral sources and prospects, get built on top of that as you grow, and your style points at which one first. Around all of it is your brand: being known for what you know, so opportunity can find you."
  },
  principlesLead:"A few principles as you read your plan:",
  principles:[
    ["Start where you are","not where you think you should be. The version of you that shows up on a busy Tuesday is the one who has to do this, so the plan that works is the one that fits that person."],
    ["Relationships come before transactions","The strongest BD doesn't feel like selling. It feels like being genuinely useful to people you'd want to help anyway."],
    ["Consistency beats intensity","A little, done regularly, compounds."],
    ["There's no single right way","The most effective business development starts with how you're actually wired, which is exactly what your profile and this plan are built around. If we start with where you are at, then we can build upon that and stretch into a complete plan."]
  ],
  close:"Let's put it to work."
};
const STYLE_PROFILE={
  connector:"Your lean is building relationships. You're the one who tries to be a helpful connector, who can maintain a decent network, and you're up for a coffee. Relationships are a natural way for you to operate, and you need to lean into that advantage. Now your plan needs to become: how are you going to be intentional in building and maintaining those relationships?",
  driver:"Your lean is making things happen. You see an opening and you go for it, up for starting the conversation and chasing the work. That initiative is rare, and you need to lean into it. Now here's your growth opportunity: Drivers can move so fast they pitch before they've listened. So your plan needs to become: how do you slow down just enough to lead with the other person first, and let the opportunity surface from there? That's what turns a fast start into closed work.",
  educator:"Your lean is being known for what you think, not for working a room. When you've got something useful to say, you say it well, and when the right people see your thinking, they come to you already half a client. That's your opportunity, business that shows up because of your reputation. You need to lean into that. Now here's your growth challenge: Educators can hide behind the work, publish, then wait. So your plan needs to become: how do you use your thinking to start the conversation, and actually reach out to the people it lands with?",
  power:"This one's rare. Your lean is all of it, you move comfortably across deepening clients, working a network, chasing opportunities, and building your personal brand. Most people lean on one or two; you're at home in several, and that range is a real asset. So your challenge isn't whether you can, it's focus. The Powerhouse trap is spreading thin: a bit of everything, nothing compounding. Now your plan needs to become: which one or two will you point at this quarter, and let them build? Consistency on a few beats a little of everything.",
  powerBuilder:"This one's rare, and rarer this early. Your lean is all of it: building the internal relationships, chasing the room, and being known for your thinking, all at once. Most people this stage lean on one; you're at home across several, and that range is a genuine asset. But the trap is sharper for you than for someone with a book behind them, you've got less capacity, and no client base to anchor it. Spread across everything and nothing compounds; you just get tired. So your plan needs to become: which one lane will you pick this quarter and go deep on? Depth on one is what turns raw range into a reputation."
};
/* Energy is keyed to solo/in-room (how you recharge), NOT to style, an introverted
   Connector still does their best work one coffee at a time. */
const ENERGY={
  solo:{gives:"Quiet, focused time, one-to-one conversations, writing, and prep. You do your best BD from your strengths, on your own terms, and it gives energy back.",costs:"Big rooms and back-to-back events, working a crowd, constant small talk. A little goes a long way; don't build the plan out of it."},
  inroom:{gives:"Time with people, one-to-one conversations, reconnecting, making introductions, being in the room. These give energy back, so you can do a lot of them without burning out.",costs:"Solitary, broadcast-style work, long posts, cold lists, polishing a profile from behind a screen. Use it sparingly and lean on what fuels you."}
};
/* Fires when the #1 style lean has no matching action in the last 90 days (S0). */
const DISCREPANCY={
  connector:"You lean Connector, and the last 90 days say the reaching out hasn't been happening. Let's get that back going. Your first activity is below.",
  driver:"You lean Driver, and the last 90 days say the ask hasn't been happening. Let's get that back going. Your first activity is below.",
  educator:"You lean Educator, and the last 90 days say the ideas have stayed in your head. Let's get that back going. Your first activity is below."
};
const BANK={
  foundationOwner:{label:"Client foundation",
    light:["Send a client a relevant article or news item with a one-line “thought of you.”","Send a handwritten thank-you note after a milestone or a kind gesture.","Check in informally, no agenda, just how they're doing.","Send a note on a special occasion, a promotion, an anniversary.","Reach out to a client about something other than their active work.","Ask for their perspective on something."],
    medium:["Schedule a no-agenda 1:1 with a top client (breakfast, coffee, or lunch).","Ask what their top priorities are this year, and how you can help.","Send industry insight or a relevant client story.","Offer to introduce them to a useful connector.","Ask the cross-sell question: “some of my clients are dealing with [X], are you dealing with that too?”","Take a top client to a sports or entertainment event."],
    bigger:["Map your top 10 by strength and opportunity, and pick one to deepen.","Propose a strategy session to advise on their challenges.","Conduct a client feedback interview.","Propose a lunch-and-learn for their team.","Interview them for a thought-leadership piece.","Host a client dinner, roundtable, or webinar."]},
  foundationBuilder:{label:"Team-and-client foundation",
    light:["Make sure a partner sees a piece of your best work this week.","Send a thank-you note to someone who's helped you grow.","Ask a senior person how they'd approach a client situation.","Connect on LinkedIn with people you meet."],
    medium:["Ask to sit in on a client meeting or pitch to observe.","Reconnect with a peer or alum from school or a past role.","Ask to help on a proposal or pitch."],
    bigger:["Volunteer for a real role on a proposal or pitch.","Build a list of 10 internal champions and 10 external peers to invest in.","Take one relationship or small initiative end to end."]},
  referral:{label:"Referral",
    light:["Reconnect with a referral source, no ask, just stay top of mind.","Connect or reconnect on LinkedIn.","Introduce them to someone useful, give before you get.","Send an article of interest with a personal note.","Congratulate a referral source on a recent win.","Send a handwritten note."],
    medium:["Grab coffee with a referral source and ask what they're working on.","Follow up after an event you both attended.","Send a lead or referral to someone first.","Ask their perspective on the market.","Ask “who are your favorite clients right now, and what's a good intro to you?”"],
    bigger:["Map your top 5–12 and pick one specific way to be useful to each, then do it.","Share your target list and ask who they know.","Request or make a specific introduction.","Co-host a client event or joint lunch-and-learn.","Propose a real partnership: shared lists, regular meetings."]},
  prospect:{label:"Prospect",
    light:["Reach out to one warm prospect you've met before.","Follow up on a conversation that had potential.","Add one best-fit company to your target list.","Research a decision-maker on LinkedIn and note the warm path."],
    medium:["Reconnect through a mutual contact or shared association.","Ask a client or referral-source friend “do you know anyone at [company]?”","Send one tailored note that leads with their problem, not your pitch.","Mention a target company with people who might know them."],
    bigger:["Build a real target list of best-fit companies, each with a warm path.","Put your list in front of 1–2 trusted friends each quarter and ask for introductions.","Pursue one “dream client” with a deliberate, multi-touch plan.","When warm paths are exhausted, one personalized LinkedIn outreach that leads with their problem."]},
  brand:{label:"Brand",
    light:["Comment thoughtfully on a few posts in your space.","Share an article with your own one-paragraph take.","Update your LinkedIn profile: photo and a clear “who I help.”","Connect on LinkedIn with everyone you recently met."],
    medium:["Write one short post answering a question clients keep asking.","Post an anonymized client story, make the client the hero.","Attend an association event where your ideal clients gather, and set at least one 1:1 meeting.","Turn a piece of good work into an insight and send it to a few people directly."],
    bigger:["Pitch and deliver a talk, panel, or webinar.","Join a committee or pursue a board seat (a 12-month commitment).","Run the pre-conference playbook, 4–6 meetings booked before you arrive.","Host a firm event (roundtable, client panel, or dinner) and invite your orbit.","Start a simple, regular publishing rhythm."]}
};
const STICK=[
  ["Put it on the calendar","BD that lives on your calendar happens. BD that lives in your head doesn't. Block a recurring slot for your weekly activity, same day, same time, and treat it like a client meeting you can't move. Thirty protected minutes a week beats three hours you keep meaning to find."],
  ["Keep it small, and keep it regular","The goal isn't a big push. It's a small, steady drip building the muscle, one thing a week, every week, takes you further in a year than a burst you can't sustain. Small enough that you'll still do it on a busy week is the right call."],
  ["Commit with someone","A commitment you keep to yourself is easy to quietly drop. So tell someone you trust, a peer, your manager, an accountability partner, what you'll do and by when, and check in. Saying it to another person makes it real, and it's the cheapest accountability there is."],
  ["Build in a check-in","Once a week, two minutes: what did I do, and who's next? That tiny review keeps the habit honest. Better still, do it with someone, a peer running the same play, a group. Accountability is the single biggest predictor of whether a plan survives a busy quarter, and it's the hardest thing to give yourself alone."],
  ["When you miss, just restart","You'll miss a week, everyone does. The habit isn't a perfect streak, it's always coming back. One missed week is nothing; quitting because you missed one is everything. Don't start over from zero, just do the next thing."]
];

const USEMAP={
  intro:"This isn't a book to read once, it's a working document. Here's how the pieces fit, and where to start.",
  items:[
    ["Part 1, Your profile","who you are, and why BD works the way it does for you."],
    ["Part 2, Your plan","the things to start now, and the one stretch that levels you up."],
    ["Part 3, Your tools","the worksheets to prep those activities."],
    ["Part 4, Your rhythm","the one priority to hold, and the weekly rhythm to run your plan on."],
    ["Part 5, Making it stick","how to turn it into a habit instead of a good intention."],
    ["Appendix, The menu","every activity, to swap in or grow into later."]
  ],
  one:"If you do one thing today: read Part 2 and put the first thing on your calendar."
};
const WHY={
  foundationOwner:"Your client foundation deepens when clients hear from you beyond the work, it's the highest-return BD there is.",
  foundationBuilder:"Early on, the people who see your work are the ones who open doors, this is how opportunity starts to find you.",
  referral:"Referrals come from people who remember you, so staying warm is the whole game.",
  prospect:"New work starts when you generate a conversation, so let's focus on that one conversation.",
  brand:"When the right people see your thinking, they come to you already half a client."
};
const LOOKS={
  "Send a client a relevant article or news item with a one-line \u201Cthought of you.\u201D":"Two minutes, forward something genuinely useful with a line like \u201Csaw this, thought of you.\u201D",
  "Make sure a partner sees a piece of your best work this week.":"If a client compliments you, make sure the partner knows about it or walk them through something a client was happy about.",
  "Reconnect with a referral source, no ask, just stay top of mind.":"A short note or coffee: \u201CIt's been too long, how are things? Let's catch up.\u201D",
  "Grab coffee with a referral source and ask what they're working on.":"Forty-five minutes, mostly listening, \u201Ctell me about your last couple of clients, what are you working on, what problems are you solving, who are you working with?\u201D, and look for a way to be useful.",
  "Reach out to one warm prospect you've met before.":"A short, specific note referencing how you met and one genuine reason to reconnect.",
  "Reconnect through a mutual contact or shared association.":"Ask a shared contact for a soft intro because warm beats cold every time.",
  "Comment thoughtfully on a few posts in your space.":"Not \u201Cgreat post\u201D, add a real point in two sentences, so the right people notice your thinking.",
  "Write one short post answering a question clients keep asking.":"Two hundred words answering one real question or problem you recently solved for a client or new thing you learned. Post it, then send it to a few people directly."
};
function pillarKey(s){return {connector:'referral',driver:'prospect',educator:'brand'}[s];}
function pick(grp,tier,idx){if(!grp||!grp[tier])return null;return grp[tier][idx]||grp[tier][0];}
function buildPlan(r){
  const builder=r.track==='builder';
  const fg=builder?BANK.foundationBuilder:BANK.foundationOwner;
  const sg=BANK[pillarKey(r.primary)];
  const lvl=batLevel(r.battery);
  const now=[],next=[]; let intro,format;
  const topTier = lvl==='charged'?'bigger':(lvl==='steady'?'medium':'light');
  // Builders extend into a pillar at a realistic ceiling, never the senior "bigger" moves
  // (keynote, board seat, host a firm event). Cap them at 'medium' (a post, a case study, an event).
  const pillarTop = (builder && topTier==='bigger') ? 'medium' : topTier;
  if(r.integrated){
    intro="You can do all of it, which is exactly the trap. So this quarter, point your effort at one pillar and go deep on the one you know you should.";
    now.push({hero:true,gkey:pillarKey(r.primary),label:`Your ${EXT[r.primary].pillar} focus`,txt:pick(sg,pillarTop,0)});
    now.push({label:fg.label,txt:pick(fg,'light',0)});
    next.push({label:fg.label,txt:pick(fg,'medium',0)});
  } else if(!r.foundationLed && r.maturity>=60){
    intro=`Your ${builder?'team-and-client':'client'} foundation is growing, so the plan leans into ${EXT[r.primary].pillar}, while keeping ${builder?'the work and your internal relationships warm':'an eye on your client engagement and internal relationships'}.`;
    now.push({hero:true,gkey:pillarKey(r.primary),label:EXT[r.primary].pillar,txt:pick(sg,lvl==='low'?'light':'medium',0)});
    now.push({label:fg.label+" (keep it warm)",txt:pick(fg,'light',0)});
    next.push({label:EXT[r.primary].pillar,txt:pick(sg,pillarTop,1)});
    next.push({label:fg.label,txt:pick(fg,'medium',0)});
  } else {
    intro=builder?"You're building your team-and-client foundation the right way. The plan keeps you there, small, intentional things, with one light step toward your natural lean.":"Your client foundation is real but not yet deliberate, so that's where we start, making the relationships you already have work a little harder. We build from there.";
    now.push({hero:true,gkey:builder?'foundationBuilder':'foundationOwner',label:fg.label,txt:pick(fg,'light',0)});
    now.push({label:fg.label,txt:pick(fg, lvl==='low'?'light':'medium', lvl==='low'?1:0)});
    next.push({label:fg.label,txt:pick(fg,'bigger',0)});
    next.push({label:EXT[r.primary].pillar+" (a first step)",txt:pick(sg,'light',0)});
  }
  // Part 5 lead-in, keyed to zone band (item 4), overrides the branch text above
  if(!r.integrated){
    const zi=Math.min(4,Math.floor(r.maturity/20)), pillar=EXT[r.primary].pillar;
    if(r.foundationLed){
      intro=builder
        ? "Your team-and-client foundation, the people who see your work, is real but not yet deliberate, so that's where we start."
        : "Your client foundation is real but not yet deliberate, so that's where we start, making the relationships you already have work a little harder.";
    } else if(zi===4){
      intro=`Your ${builder?'team-and-client':'client'} foundation is a strength, so the plan leans harder into ${pillar}, while you keep doing what got you here.`;
    } else {
      intro=`Your ${builder?'team-and-client':'client'} foundation is growing, so the plan leans into ${pillar}, while keeping it warm.`;
    }
  }
  format = r.cadence==='systematic'
    ? "You like a system, so run this as a checklist, aim for one thing a week, tick them off, and build up to a weekly rhythm."
    : "You work in bursts, so keep these as prompts, act on the next one when the moment fits.";
  [...now,...next].forEach(m=>{if(m.hero){m.why=WHY[m.gkey];m.looks=LOOKS[m.txt];}});
  return {intro,now:now.filter(x=>x.txt),next:next.filter(x=>x.txt),format};
}
function buildNinety(r){
  const pri=buildPriority(r);
  const rhythm = r.cadence==='systematic'
    ? "Commit to one thing a week from your plan. Friday, take two minutes: what did I do, and who or what's next?"
    : "A couple of BD activities a month, whenever the moment fits. Keep your plan visible and act when you see an opening.";
  let picture;
  if(r.integrated) picture="Over the coming months, one pillar will have real momentum instead of four with none, and you'll have proof that focus, not effort, was the missing piece.";
  else if(!r.foundationLed && r.maturity>=60) picture=`Over the coming months, you'll have made real progress in ${EXT[r.primary].pillar} on top of staying close to your client and internal foundation, and BD will feel more like a habit.`;
  else if(r.track==='builder') picture="Over the coming months, the right people will have seen your best work, you'll have started your own network on purpose, and you'll be noticeably closer to how the work gets won.";
  else picture="Over the coming months, the clients you already have will have heard from you with intention, you'll have deepened one relationship on purpose, and BD will feel more like a relationship exercise than a sales one.";
  return {priorityLabel:pri[0],priority:pri[1],rhythm,picture};
}
function profileName(r){return r.integrated?POWER.name:(r.foundationLed?r.zone.name:EXT[r.primary].name);}
let lastR=null;
function showPlaybook(){if(lastR)renderPlaybook(lastR);}
function backToSummary(){if(lastR){renderResults(lastR);window.scrollTo(0,0);}}
async function downloadPlaybookPDF(){
  const el=document.getElementById('pbdoc'); if(!el) return;
  const btn=document.getElementById('dlPdfBtn');
  const nm=(user&&user.name)?user.name.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,''):'';
  const fname='EnabledBD-Playbook'+(nm?'-'+nm:'')+'.pdf';
  const orig=btn?btn.innerHTML:''; if(btn){btn.innerHTML='Preparing your PDF…';btn.disabled=true;}
  try{
    // Send the already-rendered playbook markup to the server, which prints it
    // with a real headless browser (crisp vector text, real page breaks).
    const res=await fetch(API_BASE+'/.netlify/functions/generate-pdf',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({html:el.innerHTML,filename:fname})
    });
    if(!res.ok) throw new Error('PDF request failed: '+res.status);
    const blob=await res.blob();
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=fname;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
  }catch(err){
    console.error(err);
    alert('Sorry, your PDF could not be generated just now. Please try again in a moment, or use the Print button.');
  }finally{
    if(btn){btn.innerHTML=orig;btn.disabled=false;}
  }
}
function level3(v){return v>=66?'High':(v>=38?'Moderate':'Low');}
// Capacity is the concrete lever: how much of the plan to take on given the time
// you actually have. Keyed to the capacity reading (not the blended battery), and
// forked for the builder track (no client base yet).
function capacityGuide(r){
  const builder=r.track==='builder';
  const serving=builder?"the senior people you're already working with":"the clients you're already serving";
  const start=builder?"the people who already see your work":"the clients you're serving";
  const lvl=level3(r.capacity);
  if(lvl==='Low') return "Time's tight, so keep BD practical, a couple of great questions with "+serving+". High return, almost no time. Get back out there as soon as you free up.";
  if(lvl==='Moderate') return "Enough time for a few focused activities, start with "+start+", then one or two activities in your pillar.";
  return "You've got real time right now, so branch out, run the full plan and push into your pillar while it's there.";
}
function batteryCapacityBlock(r){
  // Fill the bar by tier (Low still shows a visible third, no empty/"zero" state).
  const fill=w=>w==='High'?100:(w==='Moderate'?66:34);
  const row=(label,sub,score,color)=>{const w=level3(score);return `<div class="bcrow"><div class="bclab">${label}<span>${sub}</span></div><div class="bctrack"><i style="width:${fill(w)}%;background:${color}"></i></div><div class="bcval">${w}</div></div>`;};
  return `<div class="batcap">
    ${row('Appetite','your energy and motivation for BD',r.appetite,'var(--teal)')}
    ${row('Capacity','time left after the client work, the admin, and life',r.capacity,'var(--navy)')}
    <p class="fnote" style="margin-top:12px"><b>Your capacity dictates where you spend smart BD time.</b> ${capacityGuide(r)}</p></div>`;
}
function weekCalendar(r){
  const builder=r.track==='builder';
  const lean = r.integrated?'power':r.primary;
  const ownerLean={
    connector:`<div class="wk-block">Referral-source lunch<span>a coffee or a catch-up</span></div>`,
    driver:`<div class="wk-block">Warm intro to a prospect<span>ask a client or a COI</span></div>`,
    educator:`<div class="wk-block">30 min: draft a post<span>a client story or your POV</span></div>`,
    power:`<div class="wk-block">Referral-source lunch<span>your pillar activity this week</span></div>`
  };
  const builderLean={
    connector:`<div class="wk-block">Reconnect with a peer<span>from school or a past role</span></div>`,
    driver:`<div class="wk-block">Put your hand up<span>for a pitch, proposal, or client meeting</span></div>`,
    educator:`<div class="wk-block">30 min: draft a post<span>something you learned</span></div>`,
    power:`<div class="wk-block">Your pillar activity · 30 min<span>a peer, a post, or a hand up</span></div>`
  };
  const leanCell = (builder?builderLean:ownerLean)[lean] || `<div class="wk-block">Your pillar activity · 30 min</div>`;
  const mon = builder
    ? `<div class="wk-block">Internal touch · 15 min<span>put your best work in front of a partner, or thank someone who helped you grow</span></div>`
    : `<div class="wk-block">Client touch · 30 min<span>a proactive, non-deliverable note</span></div>`;
  const wed = builder
    ? `<div class="wk-soft">Peer coffee<span>someone outside your day-to-day team</span></div>`
    : `<div class="wk-soft">Client call<span>check in, no agenda</span></div>`;
  const check=`<div class="wk-check">2-min check-in<span>what did I do? who's next?</span></div>`;
  const days=[['Mon',mon],['Tue',leanCell],['Wed',wed],['Thu',''],['Fri',check]];
  const cap = batLevel(r.battery)==='low'
    ? "This is a fuller week, yours might be one block and a check-in, and that still counts."
    : "Shape it to your week, the rhythm matters more than the number of blocks.";
  return `<div class="weekcal">${days.map(d=>`<div class="wk-day"><div class="wk-dh">${d[0]}</div>${d[1]}</div>`).join('')}</div><p class="figcap">${cap}</p>`;
}
function renderPlaybook(r){
  pWrap.style.display='none';
  const builder=r.track==='builder';
  const styleKey=r.integrated?'power':r.primary;
  const plan=buildPlan(r), pname=profileName(r);
  const _zarr=builder?BUILDER_ZONES:OWNER_ZONES;const _zi=_zarr.findIndex(z=>z.key===r.zone.key);const nextZone=(_zi>=0&&_zi<_zarr.length-1)?_zarr[_zi+1]:null;const nextZoneName=nextZone?zoneName(nextZone.name):null;
  const headColor='#14541c';
  const coverStyle=styleHeadline(r), coverArt=styleArticle(coverStyle);

  const focusPillar=r.integrated?'power':r.primary;   // the reader's lean pillar always lights (even foundation-led)
  const pre=`<div class="pbpart"><div class="pbnum">Part 1</div><div class="pbh">How business development works</div><p class="pbtldr">tl;dr: BD is a skill you build, not a type you are, and you already know enough people to grow.</p>
    ${PREFACE.intro.map(p=>`<p class="pbp">${p}</p>`).join('')}
    <div class="pbsub">Three things BD isn't</div>
    <div class="pbcard plain"><div class="pbtag">Not a personality</div>BD doesn't belong to the extroverts. The best business developers aren't the loudest people in the firm, they're the most intentional. That's a skill, and skills get built. You don't need to become someone else. You need a plan that fits how you already work.</div>
    <div class="pbcard plain"><div class="pbtag">Not working a room</div>The stack of business cards in a drawer isn't BD, it's activity with no point. The goal was never to meet more people. It's to deepen the right ones. As Tim Ferriss put it, cultivate the intense few instead of the lukewarm many.</div>
    <div class="pbcard plain"><div class="pbtag">Not outbound and lead-gen</div>This is a relationship business. Clients hire people. We build trust through getting our client foundation right first, then we can build upon that.</div>
    <div class="pbsub">A few shifts that make it click</div>
    <ul class="pbprin shift">${builder
      ? `<li><b>"I'm too junior to do BD"</b> → you can start building relationships right now.</li><li><b>"I don't have clients to call"</b> → you have relationships that will matter in five years.</li><li><b>"BD is for partners"</b> → the habits you build now decide the partner you become.</li>`
      : `<li><b>"I'll do BD when I have time"</b> → it's part of the job.</li><li><b>"I don't want to feel like a salesperson"</b> → you're a trusted advisor who asks great questions.</li><li><b>"I should network more"</b> → you should call your best clients more.</li><li><b>"Cross-selling is pitching"</b> → asking great questions <i>is</i> cross-selling.</li>`}</ul>
    ${pillarsFig(focusPillar,builder)}
    <p class="pbp">${builder?PREFACE.pyramidLead.builder:PREFACE.pyramidLead.owner}</p>
    <p class="pbp">${PREFACE.principlesLead}</p>
    <ul class="pbprin">${PREFACE.principles.map(x=>`<li><b>${x[0]}</b>, ${x[1]}</li>`).join('')}</ul>
    <p class="pbp">${PREFACE.close}</p></div>`;

  const energy=ENERGY[r.solo?'solo':'inroom'];
  const p1=`<div class="pbpart"><div class="pbnum">Part 2</div><div class="pbh">Your profile</div><p class="pbtldr">tl;dr: who you are, and why BD works the way it does for you.</p>
    <p class="pbp">This is you at your starting point.</p>
    <p class="pbp">Your profile is three things. <b>Your style</b>, how you're wired to stretch beyond the ${builder?'team-and-client':'client'} foundation. This one doesn't change much; it's how you work. <b>Your ${builder?'team-and-client':'client'} foundation</b>, where your relationship base stands today. This one needs to move, and moving it is the real work of business development. <b>Your battery</b>, how much plan you can carry right now. That's a reflection of your current state, so that will change as your work load goes up and down.</p>
    <div class="pbsub">Your style: ${styleHeadline(r)}</div>
    ${blendBars(r)}
    <p class="pbp">${r.integrated&&builder?STYLE_PROFILE.powerBuilder:STYLE_PROFILE[styleKey]}</p>
    ${r.discrepancy?`<div class="discrepancy">${DISCREPANCY[r.discrepancy]}</div>`:''}
    <div class="pbsub">${builder?"Your team-and-client foundation: "+zoneName(r.zone.name):"Your client foundation: "+zoneName(r.zone.name)}</div>
    <p class="pbp">${r.zone.desc} ${r.zone.next}</p>
    <div class="pbsub">What energizes you, and what costs you</div>
    <div class="pbcard plain"><div class="pbtag" style="color:var(--teal)">Gives you energy</div>${energy.gives}</div>
    <div class="pbcard plain"><div class="pbtag" style="color:var(--rose)">Costs you energy</div>${energy.costs}</div>
    <div class="pbsub">Your battery &amp; capacity</div>
    <p class="pbp">Two things set the size of your plan. Your <b>appetite</b>, how much energy and motivation you've got for BD right now. And your <b>capacity</b>, how much time you actually have after the client work, the admin, and life. Blend them and you get your <b>battery</b>: how ambitious a BD plan you can take on this quarter. There's no wrong reading, a busy, low-battery stretch still gets a plan, just a smaller, smarter one.</p>
    ${batteryCapacityBlock(r)}
    <p class="pbp">Your profile does two jobs: it tells you whether you need to step up with ${builder?'the people who see your work':'your clients'}, and which pillar ${builder?"you'll grow into":'to expand into'} next. Everything from here builds on those two answers.</p></div>`;

  const moveCard=(m)=>`<div class="pbcard ${m.hero?'hero':'plain'}"><div class="pbtag">${m.hero?'Start here · '+m.label:m.label}</div>${m.txt}${m.why?`<div class="movewhy"><b>Why:</b> ${m.why}</div>`:''}${m.looks?`<div class="movewhy"><b>What it looks like:</b> ${m.looks}</div>`:''}</div>`;
  const blankrows=(cols,n)=>Array.from({length:n}).map(()=>`<tr>${Array.from({length:cols}).map(()=>'<td contenteditable></td>').join('')}</tr>`).join('');

  const p2=`<div class="pbpart"><div class="pbnum">Part 5</div><div class="pbh">Your plan</div><p class="pbtldr">tl;dr: you've got the goal and the lists, now pick the few activities that matter and start.</p>
    <p class="pbp">${plan.intro}</p>
    ${pillarsFig(focusPillar,builder)}
    <div class="pbsub">Do now, lock these in</div>${plan.now.map(moveCard).join('')}
    ${nextZone ? `<div class="pbsub">Stretch, your next level</div>
    <div class="levelup"><span class="lu-now">You're here<b>${zoneName(r.zone.name)}</b></span><span class="lu-arrow">→</span><span class="lu-next">Next<b>${nextZoneName}</b></span></div>
    <p class="pbp"><b>${nextZoneName}</b>, ${nextZone.desc}</p>
    <p class="pbp">One rung up from where you are today. Don't force it, but when the do-now activities feel routine, this is where you go.</p>
    ${plan.next.map(moveCard).join('')}` : `<div class="pbsub">Stretch, the next level</div>
    <p class="pbp">${builder
      ? "There's no rung above this one this early. The next level isn't a rung, it's ownership: taking a relationship or an initiative end to end, and turning the peers you're growing with into people who send each other work."
      : "There's no rung above this one. The next level isn't a rung, it's multiplication: developing the people around you, and turning your best referral relationships into true partners."}</p>
    ${(builder
      ? ["Take one relationship or small initiative end to end, own the outcome, not just the task.","Turn a peer relationship into a two-way one, trade intros, meet quarterly."]
      : ["Bring a rising person to your next client meeting or pitch, let them watch you work.","Move one referral relationship from Strategic to Intentional, share lists, meet quarterly."]
      ).map(t=>`<div class="pbcard plain"><div class="pbtag">Stretch</div>${t}</div>`).join('')}`}
    <p class="pbp" style="margin-top:12px">${plan.format} <span style="color:var(--muted)">Want to swap one? The activity bank in the Reference section has the full menu.</span></p>
    <div class="pbsub">Get your story straight</div>
    <p class="pbp">Before any of these activities land, you need to say clearly what you do and who you help. The good news: you don't invent it, you find it in the ${builder?'work you\'ve already been part of':'clients you already have'}.</p>
    <ul class="pbprin"><li>${builder
      ? `<b>Clone the work.</b> You may not have a book yet, you have work you've been part of. Look across the best of it: the client types, the problems, the outcomes. That pattern is your story starting to form.`
      : `<b>Clone a client.</b> Look across your top clients and find the pattern, industry, size, ownership, geography, the problem you solved, the outcome you delivered.`}</li><li><b>Write the story.</b> For your best ${builder?'work':'client type'}: what was going on before you, what did you do, what was the result?</li><li><b>Drop it into the one-liner.</b> The pattern and the story make the message. You're not writing copy, you're describing what's already true.</li></ul>
    <div class="fld">Your one-liner, the Mad Lib<input class="fin" placeholder="I work with [who] who are dealing with [problem] and looking for [outcome]."></div>
    <div class="oneliner"><b>Stop saying</b> your title and your service list ("I'm a tax manager," "I'm an attorney," "we do consulting"). <b>Start saying</b> the problem you solve and who you solve it for. And this is focus, not niching, clarity creates referrals, it doesn't limit them.</div>
    <p class="pbp">You don't need a separate to-do list, your plan is the next-activity column on your lists. Part 6 is where you turn it into a weekly rhythm.</p></div>`;

  const clientHdr = builder?"Your key relationships":"Your top clients";
  const clientNote = builder
    ? "Internal champions, the peers you're building with, and any external relationships worth investing in."
    : "Your ~10 most important clients, the ones you'd build a practice around. Not the whole book.";
  const plists=`<div class="pbpart"><div class="pbnum">Part 4</div><div class="pbh">Your lists</div><p class="pbtldr">tl;dr: ${builder?"your relationships aren't a task list, they're a map that tells you your next activity.":"your book isn't a task list, it's a relationship map that tells you what to do."}</p>
    <p class="pbp">This is where the plan gets real. You already know enough people to grow, the work is being intentional about them. Fill these in once, keep them current, and they'll tell you what to do next. The <b>next activity</b> and <b>date</b> columns are where the plan actually lives. Without a date, it's a wish.</p>

    <div class="pbsub" style="font-size:18px">${clientHdr}</div>
    <p class="pbp">${clientNote} For each, track relationship strength, <b>Professional</b> (${builder?'they know your work':'you do the work'}) → <b>Collegial</b> (coffee or lunch a couple times a year) → <b>Friend</b> (you text them, you can ask for ${builder?'a favor or an intro':'intros'}). The goal is always to move a relationship up a level.</p>
    ${builder
      ? `<table class="ftab"><thead><tr><th>Name</th><th>Where they sit</th><th>Strength</th><th>How I could help them</th><th>Next activity</th><th>Date</th></tr></thead><tbody>${blankrows(6,8)}</tbody></table>`
      : `<table class="ftab"><thead><tr><th>Client</th><th>Industry</th><th>Referred by</th><th>Services</th><th>Strength</th><th>Deepen / serve more</th><th>Next activity</th><th>Date</th></tr></thead><tbody>${blankrows(8,8)}</tbody></table>`}
    <p class="pbp">Now turn the list into activity. Run each name through three lenses:</p>
    ${builder
      ? `<ul class="pbprin"><li><b>Relationship</b>, who could move up a level? A partner who could become a champion? A peer worth investing in before you need each other?</li><li><b>Visibility</b>, does the right senior person actually know what you've been doing? Who hasn't seen your work lately?</li><li><b>Opportunity</b>, which pitch, proposal, or client meeting could you put your hand up for this quarter?</li></ul>`
      : `<ul class="pbprin"><li><b>Relationship</b>, who could move up a level? A Colleague who could become a Friend? A Professional you could start showing up for proactively?</li><li><b>Retention</b>, is any top client at risk, or overdue for a real conversation?</li><li><b>Opportunity</b>, who's only using one service? That's where cross-sell lives.</li></ul>`}
    ${builder
      ? `<div class="pbcard hero"><div class="pbtag">Ask to ride along</div>"I'd love to sit in and observe so I can see what you do. Happy to take notes." Nobody senior hears that as pushy, they hear someone who gives a damn about the work. The worst answer is "not this time," and even that one tells them you're up for it.</div>`
      : `<div class="pbcard hero"><div class="pbtag">Cross-sell is a question, not a pitch</div>Don't lead with services. Lead with their problem: <i>"Most of my clients in your situation aren't getting what they need from [X], is that something you're dealing with too?"</i> That's consulting, not selling.</div>`}
${builder ? `
    <p class="pbp">The two pillars, the people who send you work, and the prospects you'll pursue, come as you grow. You'll find first steps for both in the activity bank at the back. For now, your list is the people who see your work.</p>` : `
    <div class="pbsub" style="font-size:18px">Referral sources, 5 to 12, not 50</div>
    <p class="pbp">Almost all of your growth comes from referrals and word of mouth, yet most people never track where it comes from. Start here: <b>who referred your best clients?</b> That name you've been meaning to call for a year, that's your list. Keep it small enough to be consistent and genuine.</p>
    <p class="fnote">Every referral relationship is in a phase: <b>COI</b> (you know of each other) → <b>Friendly</b> (you've connected) → <b>Strategic</b> (you meet, you trade intros) → <b>Intentional</b> (you share lists, true partners). The work is moving your best few toward Strategic and Intentional. Qualify each: do I like them? · do we share ideal clients? · will they actually make the introduction? And give first, make an introduction before you ask for one.</p>
    <table class="ftab"><thead><tr><th>Name</th><th>Phase</th><th>Shared clients?</th><th>Last touch</th><th>Next activity</th><th>Date</th></tr></thead><tbody>${blankrows(6,5)}</tbody></table>

    <div class="pbsub" style="font-size:18px">Prospective clients <span style="font-weight:400;color:var(--muted);font-size:14px">, if you've got the appetite</span></div>
    <p class="pbp">The third layer, built after the foundation, not instead of it. You're one degree from your next best client (the Kevin Bacon approach). List companies that look like your top clients but aren't yet, then find the warm path in before you'd ever consider going cold.</p>
    <table class="ftab"><thead><tr><th>Company</th><th>Why they're a fit</th><th>Who might know them</th><th>Warm path in</th><th>Next step</th></tr></thead><tbody>${blankrows(5,3)}</tbody></table>`}

    <div class="pbsub" style="font-size:18px">Your brand presence</div>
    <p class="pbp">Brand isn't your logo, it's getting eyeballs on you from the right people, so your name surfaces first when an opportunity comes up. You don't need all of it. Pick where the right people already spend their time, and go deeper there. The goal is an orbit: the right people who know you and think of you.</p>
    <table class="ftab"><thead><tr><th>Channel</th><th>What am I doing now?</th><th>What could I do?</th></tr></thead><tbody>
      <tr><td>Associations</td><td contenteditable></td><td contenteditable></td></tr>
      <tr><td>Conferences</td><td contenteditable></td><td contenteditable></td></tr>
      <tr><td>LinkedIn</td><td contenteditable></td><td contenteditable></td></tr>
      <tr><td>Online, content, webinars, newsletter</td><td contenteditable></td><td contenteditable></td></tr>
      <tr><td>Firm events</td><td contenteditable></td><td contenteditable></td></tr></tbody></table></div>`;

  const operating=`<div class="pbpart"><div class="pbnum">Part 6</div><div class="pbh">Your operating page</div><p class="pbtldr">tl;dr: the one page to pin up, your goal, your weekly rhythm, and what a good week looks like.</p>
    <p class="pbp">This is the page you actually run your BD from. If you keep one thing from this playbook, keep this. No points, no scoring system, no journaling, just the few things that keep BD happening on a busy week.</p>
    <div class="goalhdr"><div class="pbtag">Your goal</div>The one you set in Part 3, keep it in front of you as you run the week.</div>
    <div class="pbsub">Your weekly rhythm</div>
    <p class="pbp">Each week, pull one or two activities off your lists, ${builder?'an internal touch, a peer coffee, a visibility activity':'a client touch, a referral coffee, a brand action'}. Protect the time; that's the whole game.</p>
    <div class="pbsub">What a good week looks like</div>
    <p class="pbp">BD that lives on your calendar happens. BD that lives in your head doesn't. Block one recurring slot, and end the week with a two-minute check-in. Here's a week shaped for how you work:</p>
    ${weekCalendar(r)}
    <div class="pbsub">Your lists are your scoreboard</div>
    <p class="pbp">You don't need a separate log. Your scoreboard is already built, the <b>next activity</b> and <b>date</b> columns on your lists. Keep those current and you're keeping score. Did the activity happen? Move to the next one. That's the whole system.</p>
    <div class="pbsub">Make it stick</div>
    <div class="stick">${STICK.map((st,i)=>{const s=(i===0&&r.cadence==='opportunistic')?["Put it on the calendar, your way","You work in bursts, so don't fight it: block one bigger slot a month and batch your activities, then keep the two-minute weekly check-in so the bursts stay pointed at something. A burst that lives in your head doesn't happen either."]:st;return `<div class="row"><div class="n">${i+1}</div><div><b>${s[0]}</b><br>${s[1]}</div></div>`;}).join('')}</div>
    <div class="pbsub">Your review cadence</div>
    <div class="stick"><div class="row"><div class="n" style="background:var(--teal)">W</div><div><b>Weekly (15 min)</b>, do your one thing, update your lists, pick next week's.</div></div><div class="row"><div class="n" style="background:var(--teal)">M</div><div><b>Monthly</b>, review the plan: what's working, what's stuck.</div></div><div class="row"><div class="n" style="background:var(--teal)">Q</div><div><b>Quarterly</b>, re-tier, refresh your lists, reset your focus for the next stretch.</div></div></div>
    <div class="pbsub">Where this gets you</div>
    <p class="pbp">${builder
      ? `Picture it a few months out: the partners who matter knowing you're invested. A seat in the room where the work gets won. A network, inside and out, that knows your name before you need it. This is how you build relationships, and it can start with one thing on the calendar this week.`
      : `Picture it a few months out: your top clients hearing from you with intention, not just when there's work. A handful of referral sources who actually send you business, because you've been intentional with them. A reputation that makes the next conversation easier before you even walk in. That's not a sales grind, that's what a trusted advisor looks like. And it started with one thing on the calendar this week.`}</p></div>`;

  const fgKey=builder?'foundationBuilder':'foundationOwner';
  const myPillar=pillarKey(r.primary);
  const bankHtml=[fgKey,'referral','prospect','brand'].map(key=>{
    const g=BANK[key], mine=(key===fgKey)||(key===myPillar)||r.integrated;
    const mt=mine?(key===fgKey?'Your foundation':(key===myPillar?'Your style pillar':'In your range')):'Grow into this later';
    const tiers=['light','medium','bigger'].map(t=>g[t]?`<div class="tier"><div class="tl">${t.charAt(0).toUpperCase()+t.slice(1)}</div><ul>${g[t].map(x=>`<li>${x}</li>`).join('')}</ul></div>`:'').join('');
    return `<div class="bankgrp ${mine?'mine':'dim'}"><h4>${g.label}</h4><div class="mt">${mt}</div>${tiers}</div>`;
  }).join('');
  const ap=`<div class="pbpart"><div class="pbnum">Reference</div><div class="pbh">Activity bank</div><p class="pbtldr">tl;dr: the complete menu, pull from here whenever an activity in your plan doesn't quite fit.</p>
    <p class="pbp">Every activity, low to high effort, across the pillars. Yours are highlighted; the rest are there to swap in, or grow into as you build.</p>
    <div class="bank">${bankHtml}</div></div>`;

  const convoOwner=`
    <div class="pbsub">Trusted advisor meeting (existing clients)</div>
    <div class="qbank">
      <div class="qrow"><div class="qlab">Open</div><div class="qq say">"How's [year] going so far? What are your biggest priorities?"</div></div>
      <div class="qrow"><div class="qlab">Relationship</div><div class="qq say">"Is there anything we could be doing better for you?" · "Any changes to your business we should know about?"</div></div>
      <div class="qrow"><div class="qlab">Opportunity</div><div class="qq say">"What's slowing you down, people, financial, operational?" · "Where do you see the biggest opportunities ahead?"</div></div>
      <div class="qrow"><div class="qlab">Cross-sell (a question, never a pitch)</div><div class="qq say">"Most of my clients in your situation aren't getting what they need from [X], is that something you're dealing with too?"</div></div>
      <div class="qrow"><div class="qlab">Referral</div><div class="qq say">"I'm trying to meet [banker / attorney / type], who do you really enjoy working with?"</div></div>
      <div class="qrow"><div class="qlab">Close</div><div class="qq">Summarize, confirm a next step, send a thank-you within 24 hours. If it went really well: "If you have friends who could use the kind of support we offer, I'd be happy to help."</div></div>
    </div>
    <div class="pbsub">Referral source meeting</div>
    <div class="qbank">
      <div class="qrow"><div class="qlab">Open / relationship</div><div class="qq say">"How's the family? What's going on with you?"</div></div>
      <div class="qrow"><div class="qlab">Client alignment</div><div class="qq say">"Give me some examples of the clients you're working with right now."</div></div>
      <div class="qrow"><div class="qlab">Their BD</div><div class="qq say">"Where are you finding success generating new clients?"</div></div>
      <div class="qrow"><div class="qlab">Network</div><div class="qq say">"Who's the most well-connected person you know that I should know?"</div></div>
      <div class="qrow"><div class="qlab">Move to intentional</div><div class="qq say">"I'm building a target list in [industry], would you look and tell me if you know anyone? Or share your list, and I'll see who I know."</div></div>
    </div>
    <div class="pbsub">Prospective client meeting</div>
    <p class="pbp">First, the mindset, it matters more than the questions. Know which meeting you're in: an <b>educational</b> one (relationship building, no active buying signal) or a <b>buying</b> one (they've got a live problem). Either way, consult to the <b>why</b>, not the how. Talk 40%, listen 60%. And carry what I call <b>unsure confidence</b>: confident you can help, genuinely unsure whether they need you, whether it's the right time, whether the budget's there. That's an advisor, not a salesperson, and it keeps you asking better questions.</p>
    <div class="pbcard plain">
      <div class="dstep"><div class="dn">1</div><div><b>Open with outcomes:</b> "Before we start, what would be a good outcome for our time together?"</div></div>
      <div class="dstep"><div class="dn">2</div><div><b>Listen, go deeper:</b> the first thing they say is rarely the real problem. "What's going on there?" → "What have you tried?" → "Why isn't that working?" → "What do you think you need?"</div></div>
      <div class="dstep"><div class="dn">3</div><div><b>Use a client story</b>, a similar situation, framed problem → solution → outcome. To show you get their world, not to pitch.</div></div>
      <div class="dstep"><div class="dn">4</div><div><b>Ask priority:</b> "What level of priority is this for you, with everything else you have going on?"</div></div>
      <div class="dstep"><div class="dn">5</div><div><b>Co-create the solution together:</b> "If I were you, I would…", even if that's not hiring you. Honest advice builds more trust than a close.</div></div>
      <div class="dstep"><div class="dn">6</div><div><b>Reference budget</b> if the value is there and it's appropriate: "Most clients who need this pay between X and Y."</div></div>
      <div class="dstep"><div class="dn">7</div><div><b>Support their decision:</b> "What can I give you that would help you make this decision?"</div></div>
      <div class="dstep"><div class="dn">8</div><div><b>Set a concrete next step.</b> "Send us some more information" isn't one, agree on the actual next action before you leave.</div></div>
    </div>`;
  const convoBuilder=`
    <div class="pbsub">The partner 1:1</div>
    <div class="qbank">
      <div class="qrow"><div class="qlab">Open</div><div class="qq say">"What are you working on right now? What's coming up that I could help with?"</div></div>
      <div class="qrow"><div class="qlab">Learn</div><div class="qq say">"How did we originally win this client?" · "What would you have done differently at my level?"</div></div>
      <div class="qrow"><div class="qlab">Visibility</div><div class="qq say">"Here's what I've been working on, I want to make sure I'm working on the right things."</div></div>
      <div class="qrow"><div class="qlab">The ask</div><div class="qq say">"Next time there's a pitch or client meeting where an extra set of hands would help, I'd love to be in the room."</div></div>
    </div>
    <div class="pbsub">The peer coffee (inside or outside the firm)</div>
    <div class="qbank">
      <div class="qrow"><div class="qlab">Open</div><div class="qq say">"What are you working on? What's your firm seeing right now?"</div></div>
      <div class="qrow"><div class="qlab">Network</div><div class="qq say">"Who should we both know?"</div></div>
      <div class="qrow"><div class="qlab">Why it matters</div><div class="qq">Your peers become the people who send you work in five years. The habit starts now, before you need it.</div></div>
    </div>
    <div class="pbsub">Getting in the room</div>
    <div class="qbank">
      <div class="qrow"><div class="qlab">The ask</div><div class="qq say">"I'd love to sit in to learn! I'll take notes."</div></div>
      <div class="qrow"><div class="qlab">After</div><div class="qq">Send your takeaways to the partner within 24 hours. That's how one seat in the room becomes a standing invitation.</div></div>
    </div>`;
  const convo=`<div class="pbpart"><div class="pbnum">Reference</div><div class="pbh">Conversation bank</div><p class="pbtldr">tl;dr: what to actually say, ${builder?'the meetings your plan actually assigns.':'frameworks, questions, and emails.'}</p>
    ${builder?convoBuilder:convoOwner}
    <div class="pbsub">Email templates</div>
    <div class="eml"><b>Catch up:</b> "Hey [Name], it's been a while since we caught up in person. It'd be great to hear what you're working on this year and how I can be most helpful. Breakfast or lunch on [two dates]?"</div>
    <div class="eml"><b>Thought of you:</b> "Hey [Name], thought of you today when I [saw this / worked through something similar] and wanted to [send this / ask how you're handling X]."</div>
    ${builder
      ? `<div class="eml"><b>Reconnect with an alum or past colleague:</b> "Hey [Name], saw the news about [their firm / their move]. It's been too long. How's it treating you? Coffee on [two dates]?"</div>`
      : `<div class="eml"><b>Referral re-engagement:</b> "Hey [Name], I want to be more intentional this year about the relationships where we can help each other, and yours is one of the first that comes to mind. Coffee on [two dates]?"</div>`}
    <div class="eml"><b>Intro two people:</b> "[A], meet [B], who [what they do]. [B], [A] is [same]. You both [reason]. I'll step out, take it from here."</div></div>`;

  const reading=`<div class="pbpart"><div class="pbnum">Reference</div><div class="pbh">Recommended reading</div><p class="pbtldr">tl;dr: your shelf, what to read and why.</p>
    <div class="bk"><div><div class="bt">The Go-Giver</div><div class="ba">Burg &amp; Mann</div><div class="bw">The referral mindset: give value first, be the connector, and the business follows.</div></div></div>
    <div class="bk"><div><div class="bt">Go-Giver Sells More</div><div class="ba">Burg &amp; Mann</div><div class="bw">The Go-Giver philosophy applied to selling without feeling salesy.</div></div></div>
    <div class="bk"><div><div class="bt">The Challenger Sale</div><div class="ba">Dixon &amp; Adamson</div><div class="bw">Teach, tailor, take control, leading with insight, not a pitch.</div></div></div>
    <div class="bk"><div><div class="bt">Gap Selling</div><div class="ba">Keenan</div><div class="bw">Diagnosing the gap between where the client is and wants to be.</div></div></div>
    <div class="bk"><div><div class="bt">Atomic Habits</div><div class="ba">James Clear</div><div class="bw">The habit engine behind "consistency compounds."</div></div></div>
    <div class="bk"><div><div class="bt">The Trusted Advisor</div><div class="ba">Maister, Green &amp; Galford</div><div class="bw">How trust actually gets built.</div></div></div>
    <div class="bk"><div><div class="bt">The Activator Advantage</div><div class="ba">Dixon et al.</div><div class="bw">What the best rainmakers do differently.</div></div></div>
    <div class="bk"><div><div class="bt">Unreasonable Hospitality</div><div class="ba">Will Guidara</div><div class="bw">Going past service to make people champion you.</div></div></div></div>`;

  const contents=`<div class="pbpart"><div class="pbnum">Your journey</div><div class="pbh">What's in here</div><p class="pbtldr">tl;dr: understand who you are, build the plan, then run it, here's the path.</p>
    <p class="pbp">Your profile and your working plan in one place. You don't need all of it today. Read the first two parts, start working on the middle section and actioning your first activities, and reach for the Reference section when you have a spark of ideas or want to try something new.</p>
    <div class="toc">
      <div class="tocgrp"><div class="toch">Understand</div><ul><li>How BD works</li><li>Your profile</li></ul></div>
      <div class="tocgrp"><div class="toch">Build</div><ul><li>Your why &amp; goal</li><li>Your lists</li><li>Your plan</li></ul></div>
      <div class="tocgrp"><div class="toch">Run it</div><ul><li>Your operating page</li></ul></div>
      <div class="tocgrp"><div class="toch">Reference</div><ul><li>Activity bank</li><li>Conversation bank</li><li>Reading</li></ul></div>
    </div></div>`;

  const whyGoal=`<div class="pbpart"><div class="pbnum">Part 3</div><div class="pbh">Your why &amp; goal</div><p class="pbtldr">tl;dr: BD is just being useful to people you'd want to help anyway, start there, then name the goal.</p>
    <p class="pbp">${builder
      ? `Before the mechanics, the reframe that makes all of this easier: business development is service. It's being genuinely useful to the people around you, the ones whose work you admire, the ones opening doors for you, the peers you're growing with. You're not becoming a salesperson. You're becoming the professional people want in the room.`
      : `Before the mechanics, the reframe that makes all of this easier: business development is service. It's being genuinely useful to people you'd want to help regardless, your clients, the people who send you work, the ones you'd love to work with. You're not becoming a salesperson. You're being a better trusted advisor, and letting the work follow.`}</p>
    <p class="pbp">${builder
      ? `So start with your why. Why does this matter to you, the career you're building, the work you want to be known for, the professional you want to become? BD sticks when it's pointed at something you actually care about.`
      : `So start with your why. Why does growing your practice matter to you, the kind of work you want more of, the team you want to build, the freedom it buys? BD sticks when it's pointed at something you actually care about.`}</p>
    <div class="fld">My why<input class="fin" placeholder="${builder?'Why building this now matters to me':'Why growing my practice matters to me'}"></div>
    <p class="pbp">Now the goal. Keep it simple and achievable, not a stretch-goal exercise. A good goal is shaped by two things: your capacity (time after the work, the admin, and life) and your appetite (what you'll actually follow through on). Start with what you'll actually do.</p>
    <div class="fld">My 1-year goal<input class="fin" placeholder="${builder?'e.g. In the room for three pitches · real relationships with five partners':'e.g. Meet with my top clients this year · $200k in new work'}"></div>
    <div class="fld">My near-term focus, the next 90 days<input class="fin" placeholder="${builder?'e.g. One internal 1:1 a month · sit in on one client meeting':'e.g. One proactive, non-deliverable conversation with a top relationship'}"></div></div>`;

  const p6=`<div class="pbpart"><div class="pbnum">Part 7</div><div class="pbh">What's next</div>
    <p class="pbp">You've got what you need to start, your profile, a plan built for how you actually work, and a way to keep it going. The first activity is the only one that matters right now: pick one thing and put it on the calendar this week.</p>
    <p class="pbp">BD is simple, but it's not always easy, and it's easier alongside other people doing the same work. That's most of what I do: helping firms and the people in them build BD that actually sticks.</p>
    <div class="nextcta"><div class="hl">${builder?"Don't run this alone":"If any of this is worth a conversation"}</div>
      ${builder
        ? `<div class="ht">Doing this alongside other people makes it stick. <a href="#" onclick="joinWaitlist(event,this)">Join the waitlist</a> for the community, for people doing exactly this work.</div>`
        : `<div class="ht">Growing this across your team or firm? That's the work I do with firms. <a href="mailto:${CONTACT_EMAIL}?subject=BD%20for%20our%20team">Let's talk</a>.</div>`}
      <div class="sec">The newsletter, more BD like this, once a month. <a href="#" onclick="subscribeNewsletter(event,this)">Subscribe</a>.</div>
      <div class="sec">Follow along: <a href="${PODCAST_URL}" target="_blank" rel="noopener">the podcast</a> · <a href="${LINKEDIN_URL}" target="_blank" rel="noopener">LinkedIn</a></div>
    </div>
    <p class="pbp" style="text-align:center;color:var(--muted);font-style:italic">You already know enough people to grow, go make the first call.</p>
    <p class="pbdisclaimer" style="font-size:11px;color:var(--muted);margin-top:22px;line-height:1.5">${DISCLAIMER_TEXT}</p></div>`;

  app.innerHTML=`<div class="pbtoolbar"><button class="btn btn-ghost" onclick="backToSummary()">← Back to summary</button><div style="display:flex;gap:6px;align-items:center"><button class="btn btn-ghost" onclick="window.print()">Print</button><button class="btn btn-primary" id="dlPdfBtn" onclick="downloadPlaybookPDF()">Download playbook (PDF)</button></div></div>
    <div class="pb"><div class="doc" id="pbdoc">
      <div class="pbcover"><div style="margin-bottom:12px">${BRANDMARK(52)}</div><div class="k">EnabledBD · Business Development Playbook</div><h1 style="color:${headColor}">You're ${coverArt} ${coverStyle}.</h1><div class="signature" style="margin:2px 0 0">${signatureLine(r)}</div><div class="who">${user.name?user.name+' · ':''}${user.industry||'Professional services'}</div><p class="coverline">Your personal BD plan, built for how you actually work.</p><div class="pyramidWrap" style="margin:16px 0 6px">${pyramidSVG(focusPillar)}</div><div class="coverstats"><div class="cstat"><div class="cnum">71%</div><div class="clab">of buyers find firms through referrals and word of mouth</div></div><div class="cstat"><div class="cnum">79%</div><div class="clab">of clients would buy more from a firm they already use</div></div>${builder?`<div class="cstat"><div class="cnum">80%+</div><div class="clab">of buyers visit your website before deciding to engage</div></div>`:`<div class="cstat"><div class="cnum">~50%</div><div class="clab">of clients don't know everything you could help them with</div></div>`}</div><p class="coversource" style="font-size:11px;color:var(--muted);margin-top:10px;text-align:center">Source: Hinge Research Institute.</p></div>
      ${contents}${pre}${p1}${whyGoal}${plists}${p2}${operating}${ap}${convo}${reading}${p6}
    </div></div>`;
  window.scrollTo(0,0);
}


/* ---- questions ---- */
const GATE={id:"GATE",sec:"About your role",type:"single",text:"Which best describes your role with clients today?",
  opts:[{t:"I'm accountable for winning and keeping client relationships"},
        {t:"I lead some relationships and support partners on others"},
        {t:"I work closely with clients, but partners own the relationships"},
        {t:"I'm earlier in my career, mostly focused on the work"}]};
const FOLLOWUP={id:"FOLLOWUP",sec:"About your role",type:"single",text:"Where would you most like to focus right now?",
  opts:[{t:"I want to build better relationships with my current clients"},{t:"Building toward more of my own"}]};

const FOUNDATION_LEAD="A few of these ask what's actually happened lately, not what should have. Start where you are. No judgment; the output will tell us where to start.";
const OWNER_MAT=[
  {id:"OM1",sec:"Your client foundation",lead:FOUNDATION_LEAD,type:"single",text:"In the last month, how many times did you reach out to a client to talk about or suggest something other than the work you are doing for them?",
   opts:[{t:"Not once",s:{mat:0}},{t:"Once",s:{mat:.4}},{t:"A few times",s:{mat:.75}},{t:"Most weeks",s:{mat:1}}]},
  {id:"OM2",sec:"Your client foundation",type:"single",text:"Think of your top three clients. How many of their top business priorities this year could you name without guessing?",
   opts:[{t:"None",s:{mat:0}},{t:"One",s:{mat:.5}},{t:"Two or three",s:{mat:1}}]},
  {id:"OM3",sec:"Your client foundation",type:"single",text:"When you can see a way a client could use more help than they've asked for, you…",
   opts:[{t:"Understand that they know what we do, they'll raise it when they need something",s:{mat:.35}},{t:"Bring it up with them yourself",s:{mat:1}}]},
  {id:"OM4",sec:"Your client foundation",type:"single",text:"Your most important client relationships run on…",
   opts:[{t:"Great work and being available",s:{mat:.4}},{t:"A proactive advisory approach",s:{mat:1}}]}
];
const BUILDER_MAT=[
  {id:"BM1",sec:"Building your team-and-client foundation",lead:FOUNDATION_LEAD,type:"single",text:"In the last six months, how many pitches, proposals, referral-source meetings, or client meetings did you put your hand up for?",
   opts:[{t:"None",s:{mat:0}},{t:"One",s:{mat:.5}},{t:"A few",s:{mat:1}}]},
  {id:"BM2",sec:"Building your team-and-client foundation",type:"single",text:"In the last quarter, how many coffees or catch-ups did you have with people outside your day-to-day team?",
   opts:[{t:"None",s:{mat:0}},{t:"One or two",s:{mat:.5}},{t:"Several",s:{mat:1}}]},
  {id:"BM3",sec:"Building your team-and-client foundation",type:"single",text:"When you do great work on a client, you…",
   opts:[{t:"Let the quality of your work speak for itself",s:{mat:0}},{t:"Make sure your leadership sees your best work",s:{mat:1}}]},
  {id:"BM4",sec:"Building your team-and-client foundation",type:"single",text:"In front of a client, you…",
   opts:[{t:"Focus on the deliverable and making sure they are happy with your work",s:{mat:0}},{t:"Focus on the relationship and care about them as a person",s:{mat:1}}]},
  {id:"BM5",sec:"Building your team-and-client foundation",type:"single",text:"With the relationships you're building toward, internally and externally, how deliberate are you?",
   opts:[{t:"I focus on the work; the right relationships will come",s:{mat:0}},{t:"I keep up the ones I naturally have",s:{mat:.5}},{t:"I deliberately invest in a set of relationships I'm building toward",s:{mat:1}}]}
];
const STYLE=[
  {id:"S0",sec:"Your style",type:"multi",text:"Which of these have you actually done in the last 90 days?",sub:"Check all that apply.",
   opts:[{t:"Made an introduction between two people in your network",s:{connector:.75}},{t:"Directly asked someone new for a meeting, an introduction, or the work",s:{driver:.75}},{t:"Wrote, posted, or spoke somewhere with your point of view",s:{educator:.75}},{t:"None of these lately",none:true}]},
  {id:"F1",sec:"Your style",type:"single",text:"Setting aside the clients you already serve, a free hour for business development goes to…",
   opts:[{t:"Catching up with someone in your network, no agenda, no ask",s:{connector:1}},{t:"Reaching out to someone you'd like to work with, knowing it may go nowhere",s:{driver:1}},{t:"Writing something with your point of view, an hour alone at the keyboard",s:{educator:1}}]},
  {id:"F3",sec:"Your style",type:"single",text:"You meet someone new who could hire you. Your instinct is to…",
   opts:[{t:"Look for a way to be helpful or connect them with someone, even if nothing comes back your way",s:{connector:1.5}},{t:"See whether there's a fit to work together, and say so",s:{driver:1.5}}]},
  {id:"F4",sec:"Your style",type:"single",text:"After having multiple meetings and an event, you feel…",
   opts:[{t:"Ready for quiet, you recharge on your own",s:{solo:1}},{t:"Energized about the connections, happy to keep the conversations rolling",s:{solo:0}}]},
  {id:"F5",sec:"Your style",type:"single",text:"You'd rather be known for…",
   opts:[{t:"The strength of your relationships, the one everyone calls",s:{connector:1}},{t:"The business you bring in, the one who wins the work",s:{driver:1}},{t:"The quality of your thinking, the one people quote",s:{educator:1}}]},
  {id:"F6",sec:"Your style",type:"rank",text:"Rank these by how much each sounds like you.",sub:"Tap them in order, most like you first.",
   opts:[{t:"Building and working a network of relationships",key:"connector"},{t:"Pursuing opportunities you're excited about",key:"driver"},{t:"Putting your ideas and expertise out there",key:"educator"}]},
  {id:"F8",sec:"Your style",type:"single",text:"Honestly, where does your energy naturally go?",
   opts:[{t:"Deeper with the people you already know and trust",s:{outward:0}},{t:"Toward new people and new circles",s:{outward:1}}]}
];
const BATTERY=[
  {id:"B1",sec:"Your BD Battery",type:"scale",text:"How do you feel about doing business development right now?",hint:"No right answer.",
   opts:[{t:"Dread it",s:{app:0}},{t:"I'll do it if I must",s:{app:.33}},{t:"Open, and want to get better",s:{app:.66}},{t:"I seek it out",s:{app:1}}]},
  {id:"B2",sec:"Your BD Battery",type:"scale",text:"Adding BD to your week feels like…",opts:[{t:"One more thing I can't fit",s:{app:0}},{t:"Doable if it's simple",s:{app:.5}},{t:"Energizing",s:{app:1}}]},
  {id:"B3",sec:"Your BD Battery",type:"single",text:"Over a typical month, your BD looks most like…",opts:[{t:"Consistent - I get to it most days",s:{app:1,steady:1}},{t:"Focused on a few areas when I can get to it most weeks",s:{app:.5}},{t:"Sporadic, when I remember or have to",s:{app:0}}]},
  {id:"B4",sec:"Your BD Battery",type:"single",text:"When you think about reaching out to someone you don't know well, you…",opts:[{t:"Worry about being a nuisance",s:{app:.2}},{t:"Figure your perspective is worth their time",s:{app:1}}]},
  {id:"B5",sec:"Your BD Battery",type:"single",text:"When outreach goes quiet or you get a no, you…",opts:[{t:"Can't help but take it personally and ease off",s:{app:.2}},{t:"Shrug it off and keep going",s:{app:1}}]},
  {id:"B6",sec:"Your BD Battery",type:"scale",text:"Your current workload is…",opts:[{t:"Underwater",s:{cap:0}},{t:"Busy but managing",s:{cap:.5}},{t:"I have some room",s:{cap:1}}]},
  {id:"B7",sec:"Your BD Battery",type:"scale",text:"Your work-life balance right now is…",opts:[{t:"Stretched thin",s:{cap:0}},{t:"Okay",s:{cap:.5}},{t:"In a good place",s:{cap:1}}]},
  {id:"B8",sec:"Your BD Battery",type:"scale",text:"Realistically, the time you can give BD each week is…",opts:[{t:"Almost none",s:{cap:0}},{t:"30–60 minutes",s:{cap:.5}},{t:"A few hours",s:{cap:1}}]}
];
const CADENCE=[
  {id:"C1",sec:"How you like to work",type:"single",text:"How do you like to get things done?",opts:[{t:"I follow a system and a checklist",s:{sys:1}},{t:"I work in bursts when the moment strikes",s:{sys:-1}}]},
  {id:"C2",sec:"How you like to work",type:"single",text:"A BD plan works best for you when it's…",opts:[{t:"A clear set of steps to check off",s:{sys:1}},{t:"A few flexible prompts I can fit into my day",s:{sys:-1}}]}
];

let pos=0, answers={}, user={name:"",email:"",industry:""};
const app=document.getElementById('app'),pWrap=document.getElementById('progressWrap'),pBar=document.getElementById('progressBar');

function getTrack(){
  const g=answers['GATE'];
  if(g===0) return 'owner';
  if(g===2||g===3) return 'builder';
  if(g===1){const f=answers['FOLLOWUP']; if(f===0) return 'owner'; if(f===1) return 'builder'; return null;}
  return null;
}
function getSequence(){
  let seq=[GATE];
  if(answers['GATE']===1) seq.push(FOLLOWUP);
  const t=getTrack();
  if(!t) return seq;
  seq=seq.concat(t==='owner'?OWNER_MAT:BUILDER_MAT, STYLE, BATTERY, CADENCE);
  return seq;
}

function renderIntro(){
  pWrap.style.display='none';
  app.innerHTML=`<div class="screen intro">
    <div class="eyebrow">The 5-minute BD style assessment</div>
    <h1>You already know enough<br>people to grow.</h1>
    <p class="lead">Your next client is probably already in your phone. Find your BD style and the fastest place to start, in about five minutes.</p>
    <div class="whofor">
      <p class="whotag">Built for those that know how to do good work, but never trained to grow a book.</p>
      <p class="whoind">Accountants · lawyers · consultants · financial services · engineers · architects · agencies · and every professional-services firm in between.</p>
    </div>
    <div class="introFig">${BRANDMARK(132)}</div>
    <div class="getlist">
      <div class="getitem"><div class="gk">Your BD style</div><div class="gv">Connector, Driver, Educator, or Powerhouse.</div></div>
      <div class="getitem"><div class="gk">Where you stand</div><div class="gv">Your client foundation, and how much to take on right now.</div></div>
      <div class="getitem"><div class="gk">Your plan</div><div class="gv">A first move for this week, plus a full playbook built for how you work.</div></div>
    </div>
    <div class="chips"><span class="chipLbl">Which are you?</span><span class="chip">Connector</span><span class="chip">Driver</span><span class="chip">Educator</span><span class="chip">Powerhouse</span></div>
    <div class="fields"><select id="fIndustry"><option value="">Your industry (optional)</option><option>Accounting</option><option>Law</option><option>Consulting</option><option>Financial Services</option><option>Engineering / Architecture</option><option>Marketing / Agency</option><option>Other professional services</option></select></div>
    <p class="micro">Free · about 5 minutes · see your profile with no email.</p>
    <button class="btn btn-primary" onclick="startQuiz()">Find your BD style →</button></div>`;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function shuffleStyleOptions(){STYLE.forEach(q=>{                 // kill primacy bias; scoring reads the option object, so order is safe
  if(q.id==='S0'){const none=q.opts.filter(o=>o.none),rest=shuffle(q.opts.filter(o=>!o.none));q.opts=[...rest,...none];}
  else shuffle(q.opts);
});}
/* GA4 funnel events — guarded so it never errors when analytics is absent/blocked (or in tests). */
function track(name,params){ try{ if(window.gtag) window.gtag('event',name,params||{}); }catch(_){} }
function startQuiz(){track('assessment_start');user.industry=(document.getElementById('fIndustry')||{}).value||"";shuffleStyleOptions();pos=0;renderQuestion();}

function renderQuestion(){
  const seq=getSequence(); const q=seq[pos];
  pWrap.style.display='block'; pBar.style.width=(pos/seq.length*100)+'%';
  const a=answers[q.id]; let body='';
  if(q.type==='single'||q.type==='scale'){
    const cls=q.type==='scale'?'scaleRow':'opts';
    body=`<div class="${cls}">`+q.opts.map((o,i)=>`<button class="opt ${a===i?'sel':''}" onclick="pickSingle(${i})">${q.type==='single'?'<span class="dot"></span>':''}<span>${o.t}</span></button>`).join('')+`</div>`;
  } else if(q.type==='rank'){
    const order=a?a.order:[];
    body=`<div class="opts">`+q.opts.map((o,i)=>{const r=order.indexOf(i);const b=r>=0?`<span class="badge rank">${r+1}</span>`:'';return `<button class="opt ${r>=0?'sel':''}" onclick="pickRank(${i})"><span>${o.t}</span>${b}</button>`;}).join('')+`</div>`+(order.length?`<div style="margin-top:14px"><button class="btn-link" onclick="resetRank()">Reset</button></div>`:'');
  } else if(q.type==='multi'){
    const sel=Array.isArray(a)?a:[];
    body=`<div class="opts">`+q.opts.map((o,i)=>`<button class="opt ${sel.includes(i)?'sel':''}" onclick="pickMulti(${i})"><span class="chk"></span><span>${o.t}</span></button>`).join('')+`</div>`;
  }
  const last = pos===seq.length-1 && !!getTrack();
  app.innerHTML=`<div class="screen">
    <div class="qcount">${q.sec} · ${pos+1} of ${seq.length}</div>
    ${q.lead?`<div class="note" style="margin:0 0 20px">${q.lead}</div>`:''}
    <div class="qtext">${q.text}</div>${q.sub?`<div class="qsub">${q.sub}</div>`:''}${q.hint?`<div class="hint">${q.hint}</div>`:''}
    ${body}
    <div class="nav">
      <button class="btn btn-ghost" onclick="goBack()" ${pos===0?'style="visibility:hidden"':''}>← Back</button>
      <button class="btn btn-primary" onclick="goNext()" ${isAnswered(q)?'':'disabled'}>${last?'See my profile':'Next'}</button>
    </div></div>`;
}
function isAnswered(q){const a=answers[q.id];if(a===undefined)return false;
  if(q.type==='single'||q.type==='scale')return typeof a==='number';
  if(q.type==='multi')return Array.isArray(a)&&a.length>=1;
  if(q.type==='rank')return a.order&&a.order.length===q.opts.length;return false;}
function pickMulti(i){const seq=getSequence();const id=seq[pos].id;const q=seq[pos];
  let a=Array.isArray(answers[id])?answers[id].slice():[];
  if(q.opts[i].none){ a=a.includes(i)?[]:[i]; }               // "None" is exclusive
  else { a=a.filter(x=>!q.opts[x].none); const p=a.indexOf(i); if(p>=0)a.splice(p,1); else a.push(i); }
  answers[id]=a; renderQuestion();}
function pickSingle(i){const seq=getSequence();answers[seq[pos].id]=i;renderQuestion();
  // auto-advance only for non-branching, fully-resolved steps
  const id=seq[pos].id;
  if(id!=='GATE'&&id!=='FOLLOWUP'){setTimeout(()=>{const s=getSequence();if(pos<s.length-1){pos++;renderQuestion();}},230);}}
function pickRank(i){const seq=getSequence();const id=seq[pos].id;let a=answers[id]||{order:[]};const p=a.order.indexOf(i);if(p>=0)a.order.splice(p,1);else a.order.push(i);answers[id]=a;renderQuestion();}
function resetRank(){answers[getSequence()[pos].id]={order:[]};renderQuestion();}
function goBack(){if(pos>0){pos--;renderQuestion();}}
function goNext(){const seq=getSequence();if(!isAnswered(seq[pos]))return;
  if(pos<seq.length-1||!getTrack()){pos++;renderQuestion();} else finish();}

/* ---- scoring ---- */
function computeResults(){
  const track=getTrack();
  const matSet = track==='owner'?OWNER_MAT:BUILDER_MAT;
  const matIds = matSet.map(q=>q.id);
  const ext={connector:0,driver:0,educator:0};
  let matSum=0,matN=0,appSum=0,appN=0,capSum=0,capN=0,sys=0,outward=0,solo=0,noneRecent=false;
  function apply(s){if(!s)return;for(const k in s){
    if(k in ext)ext[k]+=s[k];
    else if(k==='mat'){matSum+=s[k];matN++;}
    else if(k==='app'){appSum+=s[k];appN++;}
    else if(k==='cap'){capSum+=s[k];capN++;}
    else if(k==='sys')sys+=s[k];
    else if(k==='outward')outward=s[k];
    else if(k==='solo')solo=s[k];}}
  const s0Styles=new Set(); // which style leans the reader has actually acted on lately (S0)
  [...matSet,...STYLE,...BATTERY,...CADENCE].forEach(q=>{const a=answers[q.id];if(a===undefined)return;
    if(q.type==='single'||q.type==='scale')apply(q.opts[a].s);
    else if(q.type==='multi'){(a||[]).forEach(i=>{const o=q.opts[i];if(!o)return;if(o.none){noneRecent=true;}else{apply(o.s);if(o.s)for(const k in o.s)s0Styles.add(k);}});}
    else if(q.type==='rank'){const pts=[3,1.5,0];a.order.forEach((oi,r)=>{ext[q.opts[oi].key]+=pts[r];});}});
  for(const k in ext)ext[k]=Math.max(0,ext[k]);
  const clamp=v=>Math.max(0,Math.min(100,v));
  const maturity=clamp(matN?Math.round(matSum/matN*100):50);
  const appetite=clamp(appN?Math.round(appSum/appN*100):50);
  const capacity=clamp(capN?Math.round(capSum/capN*100):50);
  const battery=clamp(Math.round(appetite*.55+capacity*.45));
  const cadence=sys>=0?'systematic':'opportunistic';
  const entries=Object.entries(ext).sort((a,b)=>b[1]-a[1]);
  const maxV=entries[0][1]||1, primary=entries[0][0], secondary=entries[1][0];
  const strong=entries.filter(e=>e[1]>=0.6*maxV).length;
  // Powerhouse = an even, outward blend on a real foundation. Track-neutral: a
  // builder can be a Powerhouse too (rarer, but the range is the whole point).
  const integrated = maturity>=60 && strong>=2 && appetite>=58 && outward===1;
  const foundationLed = !integrated && maturity<60;
  const zones = track==='owner'?OWNER_ZONES:BUILDER_ZONES;
  const zone=zones[Math.min(4,Math.floor(maturity/20))];
  const radar={};for(const k in ext)radar[k]=Math.round(ext[k]/maxV*100);
  // Discrepancy: the #1 style lean has no matching action in the last 90 days (or nothing recent at all).
  const discrepancy = (!integrated && (noneRecent || !s0Styles.has(primary))) ? primary : null;
  return {track,ext,radar,maturity,appetite,capacity,battery,cadence,primary,secondary,foundationLed,integrated,zone,zones,solo,noneRecent,discrepancy};
}
function finish(){
  lastR=computeResults();
  track('assessment_complete',{style:styleHeadline(lastR),track:lastR.track});
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce){ renderResults(lastR); return; }               // no transition theater under reduced motion
  pWrap.style.display='none';
  app.innerHTML=`<div class="reading"><div class="readingInner"><div class="readingDot"></div><div class="readingTxt">Reading your answers…</div></div></div>`;
  window.scrollTo(0,0);
  setTimeout(function(){ renderResults(lastR); }, 1000);     // one ~1s beat, then the reveal
}

function pyramidSVG(focusKey){
  // Clients = foundation slab; Referral + Prospect = two pillars standing on it in
  // tandem; Brand = the ring wrapping the whole structure. The reader's lean lights up.
  const on={referral:focusKey==='connector'||focusKey==='power',
            prospect:focusKey==='driver'||focusKey==='power',
            brand:focusKey==='educator'||focusKey==='power'};
  const MUTE='#e9ebe3', MTX='#8a8a80', MBD='#d3d6cc';
  const BRAND_GREEN='#346438';   // Educator's lit ring/chip, a real green, same weight as a lit pillar
  const POWER_MID='#4f7d56';     // Powerhouse: ONE mid-green for all three elements, no element fuller
  const power=focusKey==='power';
  const rect=(x,y,w,h,rx,fill,stroke)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="1.5"`:''}/>`;
  const lab=(cx,cy,t,c,sz)=>`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="${sz||12.5}" font-weight="600" fill="${c}" font-family="Hanken Grotesk,sans-serif">${t}</text>`;
  // Ring: green when it's the lean (Educator) or Powerhouse; muted otherwise.
  const ringC=power?POWER_MID:(on.brand?BRAND_GREEN:MBD), ringW=(power||on.brand)?5:2;
  // Pillars: in Powerhouse both take the SAME mid-green (equal). Single-lean covers light only theirs.
  const rF=power?POWER_MID:(on.referral?'#346438':MUTE), rT=(power||on.referral)?'#fff':MTX;
  const pF=power?POWER_MID:(on.prospect?'#64846c':MUTE), pT=(power||on.prospect)?'#fff':MTX;
  const brandLit=power||on.brand, brandFill=power?POWER_MID:(on.brand?BRAND_GREEN:'#fff');
  return `<svg width="300" height="260" viewBox="0 0 300 260" xmlns="http://www.w3.org/2000/svg">`
    + `<ellipse cx="150" cy="150" rx="128" ry="104" fill="none" stroke="${ringC}" stroke-width="${ringW}"/>`
    + rect(77,96,60,90,8,rF,(power||on.referral)?null:MBD) + lab(107,141,'Referral',rT,12)
    + rect(163,96,60,90,8,pF,(power||on.prospect)?null:MBD) + lab(193,141,'Prospect',pT,12)
    + rect(58,186,184,28,8,'#14541c',null) + lab(150,200,'Clients','#fff')
    + `<rect x="116" y="35" width="68" height="22" rx="11" fill="${brandFill}" stroke="${brandLit?'none':MBD}" stroke-width="${brandLit?0:1.5}"/>`
    + lab(150,46,'Brand',brandLit?'#fff':MTX,12)
    + `</svg>`;
}
function pillarsFig(focusKey,builder){
  const cap=builder?"Start with the people who see your work. The pillars come as you grow.":"Start with clients. Extend into your pillar, you don't need all of them.";
  return `<div class="pyramidWrap">${pyramidSVG(focusKey)}</div><p class="figcap">${cap}</p>`;
}
/* "The three styles" comparison strip, reader's own highlighted; teaches the pillars. */
function stylesCompare(r){
  const cards=['connector','driver','educator'].map(k=>{
    const me=!r.integrated && k===r.primary;
    return `<div class="scard${me?' me':''}"><div class="sc-h"><b style="color:${EXT[k].color}">${EXT[k].name.replace('The ','')}</b><span class="sc-pill">${EXT[k].pillar}</span>${me?'<span class="sc-you">you</span>':''}</div><div class="sc-d">${COMPARE_LINE[k]}</div></div>`;
  }).join('');
  const pow=r.integrated
    ? `<p class="sc-note"><b>You're a Powerhouse</b>, strong across all three. Rare, and the reason your plan is about focus, not range.</p>`
    : `<p class="sc-note">A rare few are strong across all three at once. That's a <b>Powerhouse</b>.</p>`;
  return `<div class="stylesCompare"><div class="sc-lead">The three styles</div><div class="sc-grid">${cards}</div>${pow}</div>`;
}
/* Share affordance (item 7): shares a STYLE-ONLY landing link (?s=), never the ?r= playbook.
   Explicit options so the reader always knows their choices (LinkedIn is the primary channel). */
function shareData(){
  const style=styleHeadline(lastR), art=styleArticle(style);
  const skey=lastR.integrated?'powerhouse':lastR.primary;
  return { url:location.origin+location.pathname+'?s='+skey,
           text:`I'm ${art} ${style}. Took the EnabledBD assessment, worth 5 minutes:` };
}
function shareStyle(){ const m=document.getElementById('shareMenu'); if(m) m.style.display=(m.style.display==='flex'?'none':'flex'); }
function shareTo(where){
  if(!lastR) return;
  track('share',{method:where,style:styleHeadline(lastR)});
  const {url}=shareData();
  if(where==='linkedin') window.open('https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(url),'_blank','noopener');
  else if(where==='copy'){
    const c=document.getElementById('copyBtn');
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(()=>{if(c)c.textContent='Link copied ✓';}).catch(()=>window.prompt('Copy your link:',url));
    else window.prompt('Copy your link:', url);
  }
}

function renderResults(r){
  pWrap.style.display='none';pBar.style.width='100%';
  const z=r.zone, builder=r.track==='builder';
  const style=styleHeadline(r), art=styleArticle(style), headColor='#14541c';

  const synth=buildSynth(r), fw=buildFramework(r), pri=buildPriority(r);

  const zi=r.zones.findIndex(x=>x.key===z.key);
  const cells=r.zones.map((x,i)=>`<div class="zone ${i===zi?'on':''}"><div class="bar"></div>${x.name.replace('The ','')}</div>`).join('');
  const order=Object.entries(r.radar).sort((a,b)=>b[1]-a[1]);
  const extBars=order.map(([k,v])=>`<div class="row"><div class="lab" style="color:${EXT[k].color}">${EXT[k].name.replace('The ','')}</div><div class="track"><i data-w="${v}" style="background:${EXT[k].color}"></i></div></div>`).join('');

  let bLabel,bColor,bRead;
  if(r.battery>=66){bLabel='Charged';bColor='var(--teal)';bRead='Room and appetite, your plan can be fuller, and you can stretch beyond your natural lane.';}
  else if(r.battery>=38){bLabel='Steady';bColor='var(--gold)';bRead='A realistic plan: a few focused activities that fit your week.';}
  else{bLabel='Low';bColor='var(--rose)';bRead='Right now, less is more, one small activity you\'ll sustain beats an ambitious plan you won\'t.';}

  const fmove = builder?BUILDER_MOVE[z.key]:OWNER_MOVE[z.key];
  const fmoveText = fmove + ((!builder&&EXT[r.primary])?(" "+STYLE_FLAVOR[r.primary]):"");
  const extmove = builder?EXT_MOVE_BUILDER:EXT_MOVE_OWNER;
  const colorSet = builder?EXT_COLOR_BUILDER:EXT_COLOR_OWNER;
  let hero, support=[];
  if(r.integrated){
    hero={tag:"Start here, pick one", txt:extmove.power+" "+colorSet.power};
    support.push({ctx:"Keep the foundation warm", txt:fmove});
  } else if(!r.foundationLed && r.maturity>=60){
    hero={tag:`Start here, your ${EXT[r.primary].pillar} activity`, txt:extmove[r.primary]+" "+colorSet[r.primary]};
    support.push({ctx:"Keep the foundation warm", txt:fmove});
  } else {
    hero={tag:"Start here, this week", txt:fmoveText};
    support.push({ctx:r.foundationLed?"When you're ready, lightly":`A first step into ${EXT[r.primary].pillar}`, txt:extmove[r.primary]+" "+colorSet[r.primary]});
  }
  support.push({ctx:"How to run it", txt:r.cadence==='systematic'?"Block a recurring slot and check it off, that's how you work best.":"Keep these as prompts and act when the moment fits, a rigid checklist isn't your style."});
  r.firstMove=hero.txt;   // the do-now starter move → HighLevel [first_move] merge field + day-0/day-7 emails

  const foundationTitle = builder?"Your team-and-client foundation":"Your client foundation";
  const foundationSub = builder?"How intentionally you're building the relationships, visibility, and habits that become your team-and-client foundation.":"How intentionally you grow business through the clients you already have.";

  app.innerHTML=`<div class="res reveal">
    <div class="revealHero">
      <div class="eyebrow">Your BD Profile</div>
      <div class="archeline"><h1 style="color:${headColor}">You're ${art} ${style}.</h1></div>
      <div class="signature">${signatureLine(r)}</div>
      <div class="shareRow"><button id="shareBtn" class="shareBtn" onclick="shareStyle()" aria-haspopup="true">Share your style</button>
        <div class="shareMenu" id="shareMenu" style="display:none">
          <button class="shareOpt" onclick="shareTo('linkedin')">LinkedIn</button>
          <button class="shareOpt" id="copyBtn" onclick="shareTo('copy')">Copy link</button>
        </div></div>
    </div>
    <div class="revealRest">
    ${(SHOW_POP_STAT&&POP_STAT_PCT[style.toLowerCase()])?`<div class="popstat rvUp">You're ${art} ${style}, like ${POP_STAT_PCT[style.toLowerCase()]}% of professional-services people who've taken this.</div>`:''}
    <div class="rvUp">${blendBars(r)}</div>
    <div class="rvUp">${stylesCompare(r)}</div>
    <p class="synth rvUp">${synth}</p>
    <div class="frameBlock rvUp"><p>${fw[0]}</p>${pillarsFig(r.integrated?'power':r.primary, builder)}<p>${fw[1]}</p></div>
    <div class="priority rvUp"><span class="plab">${pri[0]}</span>${pri[1]}</div>
    <div class="panel rvUp"><h3>${foundationTitle}</h3><div class="sub">${foundationSub}</div>
      <div class="zoneName">${zoneName(z.name)}</div><div class="spectrum">${cells}</div><p class="nextrung">${z.next}</p></div>
    <div class="panel rvUp"><h3>Your style lean</h3><div class="sub">Which pillar your energy points to when you extend beyond the foundation.</div><div class="ext">${extBars}</div></div>
    <div class="panel rvUp"><h3>Your BD Battery</h3><div class="sub">How much plan you can carry right now, a blend of your appetite for BD and the time you actually have.</div>
      <div class="bbar"><i id="batFill" style="background:${bColor}"></i></div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:14px"><span style="font-weight:700;color:${bColor}">Battery, ${bLabel}</span></div>
      <div class="subbars"><div><div class="lab"><span>Appetite</span><span>${level3(r.appetite)}</span></div><div class="mini"><i class="appFill"></i></div><div style="font-size:12px;color:var(--muted);margin-top:4px">your energy and motivation for BD</div></div><div><div class="lab"><span>Capacity</span><span>${level3(r.capacity)}</span></div><div class="mini"><i class="capFill"></i></div><div style="font-size:12px;color:var(--muted);margin-top:4px">time left after the client work, the admin, and life</div></div></div>
      <p style="font-size:14.5px;color:var(--ink);margin-top:16px">${bRead}</p>
      <p style="font-size:14px;color:var(--ink);margin-top:10px"><b>Your capacity dictates where you spend smart BD time.</b> ${capacityGuide(r)}</p></div>
    <div class="sectionLead rvUp">Where to start</div>
    <div class="heroMove rvUp"><div class="tag">${hero.tag}</div><div class="txt">${hero.txt}</div></div>
    <ul class="moves rvUp">${support.map((m,i)=>`<li><span class="pin">${i+1}</span><span><span class="ctx">${m.ctx}</span>${m.txt}</span></li>`).join('')}</ul>
    <div class="useNote rvUp">This is a starting point to reduce friction. The creation of the structure to a shared conversation. Do it!</div>
    <div class="ctaQuiet rvUp"><h4>Want the whole plan?</h4><p>The full playbook turns this into a sequenced plan with the tools, the activities, and a weekly rhythm, built for exactly how you're wired.</p>
      <button class="btn" onclick="showGate()">See the full playbook</button><div id="savedMsg"></div></div>
    <p class="resDisclaimer rvUp" style="font-size:11px;color:var(--muted);line-height:1.5;margin-top:22px">${DISCLAIMER_TEXT}</p>
    </div>
  </div>`;

  requestAnimationFrame(()=>setTimeout(()=>{
    const bf=document.getElementById('batFill');if(bf)bf.style.width=r.battery+'%';
    document.querySelectorAll('.appFill').forEach(e=>e.style.width=r.appetite+'%');
    document.querySelectorAll('.capFill').forEach(e=>e.style.width=r.capacity+'%');
    document.querySelectorAll('.ext .track > i').forEach(e=>e.style.width=e.getAttribute('data-w')+'%');
    // Staged reveal (item 8): the rest flows in; instant + in-order under reduced motion.
    const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ups=[].slice.call(document.querySelectorAll('.revealRest .rvUp'));
    if(reduce){ ups.forEach(function(e){e.classList.add('rvIn');}); }
    else { ups.forEach(function(el,i){ setTimeout(function(){el.classList.add('rvIn');}, 850+i*85); }); }
  },120));
}

/* ---- lead payload (built from the results object) ---- */
/* Stateless result URL (§5): the scored result is encoded into the link itself, 
   no database. Anyone with the link re-opens the exact playbook, and the PDF
   regenerates from it. Encodes the computed result (not raw answers), so links
   survive scoring changes. */
function encodeResult(r){
  const round=v=>Math.round(v*10)/10;
  const d={t:r.track,e:[round(r.ext.connector),round(r.ext.driver),round(r.ext.educator)],
    m:r.maturity,ap:r.appetite,cap:r.capacity,b:r.battery,cd:r.cadence==='opportunistic'?1:0,
    so:r.solo?1:0,nr:r.noneRecent?1:0,ig:r.integrated?1:0,dc:r.discrepancy||'',nm:user.name||'',ind:user.industry||''};
  return btoa(unescape(encodeURIComponent(JSON.stringify(d)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodeResult(s){
  try{ return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))))); }catch(e){ return null; }
}
function rebuildResults(d){
  const ext={connector:d.e[0],driver:d.e[1],educator:d.e[2]};
  const entries=Object.entries(ext).sort((a,b)=>b[1]-a[1]);
  const maxV=entries[0][1]||1, primary=entries[0][0], secondary=entries[1][0];
  const radar={}; for(const k in ext) radar[k]=Math.round(ext[k]/maxV*100);
  const zones=d.t==='owner'?OWNER_ZONES:BUILDER_ZONES;
  const zone=zones[Math.min(4,Math.floor(d.m/20))];
  const integrated=!!d.ig, foundationLed=!integrated && d.m<60;
  return {track:d.t,ext,radar,maturity:d.m,appetite:d.ap,capacity:d.cap,battery:d.b,
    cadence:d.cd?'opportunistic':'systematic',primary,secondary,foundationLed,integrated,
    zone,zones,solo:d.so,noneRecent:!!d.nr,discrepancy:d.dc||null};
}
function playbookUrlFor(r){return location.origin+location.pathname+'?r='+encodeResult(r);}
function buildLeadPayload(r){
  const profile=r.integrated?'The Powerhouse':(r.foundationLed?r.zone.name+' ('+r.track+', foundation-led)':EXT[r.primary].name+' ('+r.track+')');
  const styleKey=r.integrated?'powerhouse':r.primary;
  const signature=styleKey+'|'+r.zone.key+'|'+level3(r.battery).toLowerCase();
  const level=(answers['GATE']!=null&&GATE.opts[answers['GATE']])?GATE.opts[answers['GATE']].t:'';
  // Raw style scores as one readable column for the sheet, e.g. "C:32|D:32|E:37" (share of total).
  const tot=(r.ext.connector+r.ext.driver+r.ext.educator)||1;
  const pct=v=>Math.round(v/tot*100);
  const style_scores='C:'+pct(r.ext.connector)+'|D:'+pct(r.ext.driver)+'|E:'+pct(r.ext.educator);
  return {timestamp:new Date().toISOString(),instrument:INSTRUMENT,source:SOURCE,name:user.name,email:user.email,industry:user.industry,track:r.track,level,
    profile,style:styleKey,focus:EXT[r.primary]?EXT[r.primary].name:'',secondary:EXT[r.secondary]?EXT[r.secondary].name:'',
    signature,signature_line:signatureLine(r),foundation_zone:r.zone.key,foundationZone:zoneName(r.zone.name),maturity:r.maturity,foundationLed:r.foundationLed,
    style_scores,connector:r.ext.connector.toFixed(1),driver:r.ext.driver.toFixed(1),educator:r.ext.educator.toFixed(1),
    appetite:r.appetite,capacity:r.capacity,battery:r.battery,batteryLevel:level3(r.battery).toLowerCase(),cadence:r.cadence,
    solo:r.solo,noneRecent:r.noneRecent,discrepancy:r.discrepancy||'',waitlist:!!user.waitlist,newsletter:!!user.newsletter,first_move:r.firstMove||'',playbook_url:user.playbookUrl||''};
}
/* Posts the lead to the serverless capture function, which routes it to the
   configured destination (Google Sheet at launch; swap to CRM server-side). */
function captureLead(r){
  const payload=buildLeadPayload(r);
  return fetch(API_BASE+'/.netlify/functions/capture-lead',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
  }).then(res=>res.ok).catch(()=>false);
}
/* Playbook CTAs that add a HighLevel tag to the existing contact (waitlist / newsletter).
   The contact was created at the gate; clicking re-upserts with the flag set, which
   merges the tag. If someone opened a shared ?r= link and never gave an email, we ask once. */
function ensureContact(){
  if(!validEmail(user.email)){
    const em=(prompt('Enter your email:')||'').trim();
    if(!validEmail(em)) return false;
    user.email=em;
  }
  if(!user.name) user.name=user.email.split('@')[0];
  return true;
}
function tagCTA(e,el,flag,doneLabel){
  if(e) e.preventDefault();
  if(!el||el.classList.contains('done')) return;
  if(!lastR||!ensureContact()) return;
  user[flag]=true;
  el.classList.add('done');
  captureLead(lastR);                       // fire-and-forget upsert → merges the tag
  el.textContent=doneLabel; el.style.pointerEvents='none'; el.style.opacity='.7';
}
function joinWaitlist(e,el){ tagCTA(e,el,'waitlist','On the waitlist ✓'); }
function subscribeNewsletter(e,el){ tagCTA(e,el,'newsletter','Subscribed ✓'); }

/* ---- name + email gate (sits between the free summary and the playbook) ---- */
function validEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
function showGate(){
  if(!lastR) return;
  pWrap.style.display='none';
  const builder=lastR.track==='builder';
  app.innerHTML=`<div class="screen">
    <div class="eyebrow">One step to your playbook</div>
    <h1>Where should we<br>send your playbook?</h1>
    <p class="lead">Your complete, printable BD playbook, your profile, your plan, the worksheets, and the full reference banks, built for exactly how you're wired.</p>
    <div class="fields"><input id="gName" placeholder="First name" autocomplete="given-name"><input id="gEmail" type="email" placeholder="Email" autocomplete="email"></div>
    <p class="micro" style="margin:2px 0 14px">You'll get your playbook, plus a short series of emails to help you run it. Unsubscribe anytime. We don't sell or share your information.${PRIVACY_URL?` <a href="${PRIVACY_URL}" target="_blank" rel="noopener" style="color:var(--muted);text-decoration:underline">Privacy Policy</a>.`:''}</p>
    ${builder?`<label class="waitlist"><input type="checkbox" id="gWait"> Join the waitlist for the community, for people doing this work.</label>`:''}
    <p id="gErr" class="micro" style="color:var(--rose);display:none">Please enter your name and a valid email.</p>
    <div class="nav" style="justify-content:flex-start;gap:12px">
      <button class="btn btn-primary" onclick="submitGate()">Send my playbook →</button>
      <button class="btn btn-ghost" onclick="backToSummary()">← Back</button>
    </div>
  </div>`;
  window.scrollTo(0,0);
  const n=document.getElementById('gName'); if(n){if(user.name)n.value=user.name;n.focus();}
  const e=document.getElementById('gEmail'); if(e&&user.email)e.value=user.email;
}
function submitGate(){
  const name=((document.getElementById('gName')||{}).value||'').trim();
  const email=((document.getElementById('gEmail')||{}).value||'').trim();
  if(!name||!validEmail(email)){const er=document.getElementById('gErr');if(er)er.style.display='block';return;}
  user.name=name; user.email=email;
  track('gate_submit',{style:styleHeadline(lastR),track:lastR.track});
  const w=document.getElementById('gWait'); user.waitlist=!!(w&&w.checked);
  user.playbookUrl=playbookUrlFor(lastR);            // stateless link → HighLevel playbook_url + emailable
  try{ history.replaceState(null,'',user.playbookUrl); }catch(_){}  // shareable URL in the address bar
  captureLead(lastR);          // fire-and-forget, never block the playbook on the lead write
  renderPlaybook(lastR);
}
/* Boot: if the URL carries an encoded result (?r=...), re-open that exact playbook
   with no session or database; otherwise start the assessment. */
function init(){
  const enc=new URLSearchParams(location.search).get('r');
  if(enc){ const d=decodeResult(enc); if(d&&d.e){ user.name=d.nm||''; user.industry=d.ind||''; lastR=rebuildResults(d); renderPlaybook(lastR); return; } }
  renderIntro();
}
init();
