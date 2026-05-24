// Synonym clusters — words grouped by shared meaning.
// Use this in the initial learning phase: learn 5-10 words that mean roughly
// the same thing together, then test individual recall in flashcards.

const CLUSTERS = [
  {
    id: "praise",
    title: "Praise & Approval",
    gist: "Words for admiring, lifting up, or endorsing someone or something.",
    words: ["laudable","approbation","acclaim","extol","venerate","deify","lionize","canonize","tout","cherish","laudatory","exhort","commend","approbation"]
  },
  {
    id: "criticize",
    title: "Criticize & Condemn",
    gist: "Words for attacking, disparaging, or formally disapproving.",
    words: ["censure","castigate","deride","denounce","decry","excoriate","lambaste","upbraid","berate","chastise","reproach","admonish","malign","denigrate","impugn","defame","slander","calumny","opprobrium","aspersion","diatribe","harangue","tirade","scathing","mordant","trenchant","caustic","scorn","disdain","disparage","belittle","deprecate","vilify"]
  },
  {
    id: "talkative",
    title: "Talkative & Wordy",
    gist: "Lots of words. Often more than necessary.",
    words: ["loquacious","garrulous","voluble","verbose","prolix","expatiate","clamorous","vociferous","bombastic","turgid","florid"]
  },
  {
    id: "quiet",
    title: "Quiet, Reserved, Few Words",
    gist: "Saying little — whether by choice, shyness, or economy.",
    words: ["taciturn","reticent","laconic","terse","pithy","succinct","brevity","economy","diffident","demur","retiring","reserved"]
  },
  {
    id: "stubborn",
    title: "Stubborn & Unyielding",
    gist: "Will not budge from a position.",
    words: ["obdurate","obstinate","intransigent","implacable","pertinacious","headstrong","dogged","resolute","steadfast","wayward","entrenched","stalwart","tenacious"]
  },
  {
    id: "compliant",
    title: "Compliant & Yielding",
    gist: "Open to agreement, easy to mold, willing to defer.",
    words: ["obsequious","subservient","acquiesce","pliant","malleable","tractable","amenable","supple","capitulate","relent","yield","deference","obeisance"]
  },
  {
    id: "greedy",
    title: "Greedy & Stingy",
    gist: "Wanting more or holding onto what you have.",
    words: ["avaricious","rapacious","mercenary","miserly","parsimonious","penurious","covet","acquisitive","venal","stinting"]
  },
  {
    id: "generous",
    title: "Generous & Plentiful",
    gist: "Giving freely; existing in abundance.",
    words: ["magnanimous","munificent","beneficent","altruistic","largesse","copious","profuse","lavish","profligate","prodigal","extravagant","fecund","fruitful"]
  },
  {
    id: "lazy",
    title: "Lazy, Sluggish, Drained",
    gist: "Low energy — by personality, mood, or having had it sapped.",
    words: ["indolent","lethargic","somnolent","torpor","lassitude","languid","sluggish","soporific","enervate","languish","ennui","feckless"]
  },
  {
    id: "energetic",
    title: "Energetic, Lively, Passionate",
    gist: "Bursting with vigor or enthusiasm.",
    words: ["alacrity","frenetic","vivacious","ebullient","fervid","fervent","ardent","zealous","indefatigable","sedulous","invigorate","vitality","verve","heady","euphoric","exhilarating","scintillating"]
  },
  {
    id: "brave",
    title: "Brave & Bold",
    gist: "Daring action, sometimes recklessly so.",
    words: ["intrepid","audacious","valor","fortitude","mettlesome","plucky","brazen","temerity","bravado","foolhardy","resolute","redoubtable","impetuous","precipitate","precipitous"]
  },
  {
    id: "cowardly",
    title: "Cowardly & Fearful",
    gist: "Lacking courage; easily frightened.",
    words: ["craven","timorous","feeble","feckless","hapless","skittish","wary","apprehension","trepidation","fret","timid"]
  },
  {
    id: "skilled",
    title: "Skilled & Sharp",
    gist: "Clear thinking, capable hands, deep judgment.",
    words: ["adept","adroit","deft","dexterous","proficient","competent","articulate","perspicacious","sagacious","polymath","astute","canny","acumen","erudite","keen","prescient"]
  },
  {
    id: "inexperienced",
    title: "Inexperienced & Awkward",
    gist: "New to the game; clumsy or naive.",
    words: ["callow","naive","ingenuous","neophyte","fledgling","gawky","gauche","puerile","artless","dilettante","amateur","novice"]
  },
  {
    id: "honest",
    title: "Honest & Sincere",
    gist: "Saying what you mean, with integrity.",
    words: ["candid","frank","probity","ingenuous","veracity","scrupulous","forthright","artless","sincere"]
  },
  {
    id: "deceitful",
    title: "Deceitful & Dishonest",
    gist: "Tricking, misleading, or speaking falsely.",
    words: ["mendacity","prevaricate","equivocate","dissemble","duplicitous","perfidy","chicanery","calumny","beguile","inveigle","swindle","cunning","wily","devious","crafty","skullduggery","sophistry","specious","spurious","disingenuous","fabricate","feign","furtive","clandestine","surreptitious","sham","bogus","counterfeit"]
  },
  {
    id: "lessen",
    title: "Lessen, Soothe, Reduce",
    gist: "Making something less severe, intense, or large.",
    words: ["abate","mitigate","alleviate","assuage","mollify","attenuate","palliate","ameliorate","subside","wane","dwindle","appease","pacify","placate","temper","curtail","forestall","obviate"]
  },
  {
    id: "increase",
    title: "Increase, Grow, Worsen",
    gist: "Becoming larger, more numerous, or more intense.",
    words: ["burgeon","proliferate","augment","amplify","escalate","aggrandize","bolster","accentuate","exacerbate","engender","embellish","distend"]
  },
  {
    id: "begin",
    title: "Begin, Emerge, Just Forming",
    gist: "Starting out; newly forming; not yet developed.",
    words: ["commence","nascent","fledgling","inchoate","burgeon","embryonic","incipient"]
  },
  {
    id: "end",
    title: "End, Stop, Cancel",
    gist: "Bringing something to a halt.",
    words: ["cease","abate","subside","supersede","sever","quash","nullify","abrogate","relinquish","renounce","forsake","jettison","recant","banish","oust","capitulate"]
  },
  {
    id: "happy",
    title: "Happy & Cheerful",
    gist: "Positive moods, friendly warmth.",
    words: ["ebullient","sanguine","euphoric","elated","jocund","blithe","congenial","convivial","cordial","amicable","gregarious","gratify","enchant","jovial","ardent"]
  },
  {
    id: "sad",
    title: "Sad, Gloomy, Mournful",
    gist: "Heavy moods, melancholy expression.",
    words: ["morose","lugubrious","dirge","plaintive","woeful","glum","crestfallen","lament","melancholy","doleful","sullen","brood","forlorn"]
  },
  {
    id: "calm",
    title: "Calm & Composed",
    gist: "Unruffled, peaceful, hard to disturb.",
    words: ["tranquil","placid","serene","equanimity","sanguine","imperturbable","phlegmatic","stoic","quiescent","aloof","nonchalant"]
  },
  {
    id: "angry",
    title: "Angry & Hostile",
    gist: "Hot tempers, bitterness, fights.",
    words: ["irascible","fractious","pugnacious","belligerent","truculent","churlish","antipathy","animosity","animus","enmity","acrimonious","virulent","ire","umbrage","indignant","contentious","vexation","exasperated","caustic"]
  },
  {
    id: "ordinary",
    title: "Ordinary, Dull, Unoriginal",
    gist: "Tired clichés and uninspired ideas.",
    words: ["banal","mundane","prosaic","hackneyed","humdrum","pedestrian","trite","platitude","bromide","vapid","insipid","derivative","conventional","plodding"]
  },
  {
    id: "strange",
    title: "Strange & Unusual",
    gist: "Out of the ordinary in a noticeable way.",
    words: ["outlandish","eccentric","quirky","idiosyncratic","anomalous","aberrant","peculiar","exotic","fanciful","whimsical","fringe"]
  },
  {
    id: "short_lived",
    title: "Short-Lived & Fleeting",
    gist: "Here and then gone.",
    words: ["ephemeral","evanescent","transient","transitory","momentary","fleeting","fitful","temporary"]
  },
  {
    id: "lasting",
    title: "Lasting & Everywhere",
    gist: "Persistent, pervasive, or eternal.",
    words: ["perennial","perpetual","ubiquitous","indelible","omnipresent","entrenched","ingrained","immutable","pervasive","incessant"]
  },
  {
    id: "wise",
    title: "Wise, Insightful, Foresighted",
    gist: "Deep understanding and good judgment.",
    words: ["sagacious","perspicacious","prudent","judicious","astute","canny","erudite","profound","acumen","prescient","cogent","compelling"]
  },
  {
    id: "foolish",
    title: "Foolish & Silly",
    gist: "Acting without thought; lightweight.",
    words: ["puerile","frivolous","facetious","specious","fatuous","inane","banal","trifling","vacuous","feeble","callow","gullible","quixotic"]
  },
  {
    id: "confusing",
    title: "Confusing & Hard to Understand",
    gist: "Dense, hidden, or deliberately obscured.",
    words: ["abstruse","recondite","esoteric","arcane","byzantine","convoluted","opaque","inscrutable","obfuscate","enigmatic","occlude","ambiguous","obscure","cryptic","nebulous","turgid","tortuous"]
  },
  {
    id: "clear",
    title: "Clear & Easy to Understand",
    gist: "Light shining through, no haze.",
    words: ["lucid","limpid","pellucid","cogent","accessible","elucidate","articulate","perspicuous","transparent","pithy","succinct"]
  },
  {
    id: "chaotic",
    title: "Disorganized & Chaotic",
    gist: "No clear order; turbulent or scattered.",
    words: ["haphazard","hodgepodge","desultory","erratic","turbulent","fractious","tempestuous","cacophonous","tumultuous","clamorous"]
  },
  {
    id: "showy",
    title: "Showy & Ornate",
    gist: "Flashy, decorated, made to be seen.",
    words: ["flamboyant","ostentatious","baroque","ornate","florid","panache","embellish","decadent","grandiose","extravagant"]
  },
  {
    id: "plain",
    title: "Plain, Austere, Frugal",
    gist: "Stripped down, simple, sparing.",
    words: ["spartan","austere","ascetic","frugal","parsimonious","prosaic","stark","sparse","scant","modest"]
  },
  {
    id: "corrupt",
    title: "Corrupt & Morally Low",
    gist: "Wickedness, betrayal, low character.",
    words: ["depravity","turpitude","perfidy","malfeasance","venal","sordid","base","reprobate","ignoble","corrupt","debase","adulterate","vitiate"]
  },
  {
    id: "persuade",
    title: "Persuade, Coax, Provoke",
    gist: "Moving someone to action with words or pressure.",
    words: ["cajole","wheedle","cogent","compelling","eloquent","exhort","inveigle","beguile","entreat","supplicate","goad","incite","galvanize","foment","engender","construe"]
  },
  {
    id: "predict",
    title: "Predict & Foretell",
    gist: "Seeing or signaling what's coming.",
    words: ["portend","presage","prefigure","forebode","prescient","harbinger","prophetic","augur","ominous","conjectural"]
  },
  {
    id: "hidden",
    title: "Hidden & Secret",
    gist: "Concealed from view or motive.",
    words: ["clandestine","covert","surreptitious","furtive","cloak","ulterior","obscure","dissemble","abscond","occlude","esoteric","arcane"]
  },
  {
    id: "open",
    title: "Open & Visible",
    gist: "Out in plain sight; obvious.",
    words: ["overt","manifest","palpable","conspicuous","discernible","patent","candid","explicit","ostensible","flagrant","brazen"]
  },
  {
    id: "imitate",
    title: "Imitate, Copy, Fake",
    gist: "Versions of something else, sincere or fraudulent.",
    words: ["emulate","mimic","derivative","caricature","pastiche","counterfeit","sham","bogus","spurious","fabricate","specious","feign","disingenuous"]
  },
  {
    id: "reject",
    title: "Reject, Renounce, Reverse",
    gist: "Saying no, taking back, casting off.",
    words: ["spurn","repudiate","renounce","eschew","abjure","demur","decry","denounce","dissent","jettison","recant","disdain","scorn","ostracize"]
  },
  {
    id: "accept",
    title: "Accept, Agree, Defer",
    gist: "Going along with; granting; bowing to.",
    words: ["acquiesce","condone","countenance","comply","deference","obeisance","heed","sanction","concede","yield","relent"]
  },
  {
    id: "certain",
    title: "Certain & Inevitable",
    gist: "No room to doubt; cannot be otherwise.",
    words: ["ineluctable","immutable","incontrovertible","axiomatic","irrefutable","tantamount","manifest","incontestable","conclusive","empirical"]
  },
  {
    id: "uncertain",
    title: "Uncertain, Doubtful, Wavering",
    gist: "Not sure, not committed, going back and forth.",
    words: ["dubious","incredulous","ambivalent","irresolute","vacillate","equivocate","tentative","conjectural","precarious","tenuous","fallible","ambiguous","nonplussed","befuddled","quandary"]
  },
  {
    id: "harmful",
    title: "Harmful, Damaging, Disastrous",
    gist: "Causing real damage, sometimes subtly.",
    words: ["deleterious","pernicious","noxious","inimical","detrimental","calamitous","cataclysmic","ravage","debilitating","baleful","perilous","virulent","invasive","insidious","vitiate","incendiary"]
  },
  {
    id: "beneficial",
    title: "Beneficial & Favorable",
    gist: "Doing good; promoting health or fortune.",
    words: ["salubrious","salutary","conducive","efficacious","beneficent","propitious","providential","auspicious","felicitous","fortuitous","boon"]
  },
  {
    id: "arrogant",
    title: "Arrogant & Pompous",
    gist: "Acting superior; full of oneself.",
    words: ["haughty","imperious","presumptuous","supercilious","pomposity","chauvinistic","magisterial","sanctimonious","entitled","cavalier","disdain","contempt"]
  },
  {
    id: "humble",
    title: "Humble & Submissive",
    gist: "Modest, lowering oneself, deferring.",
    words: ["diffident","obsequious","modest","obeisance","supplicate","grovel","unassuming","retiring","timorous","abject"]
  },
  {
    id: "indifferent",
    title: "Indifferent & Apathetic",
    gist: "Not interested, not engaged, complacent.",
    words: ["blithe","nonchalant","cavalier","complacent","apathy","phlegmatic","oblivious","aloof","lax","insouciant","stoic","perfunctory","cursory"]
  },
  {
    id: "strict",
    title: "Strict, Severe, Demanding",
    gist: "Tight standards, no slack.",
    words: ["stern","austere","draconian","stringent","exacting","fastidious","scrupulous","punctilious","meticulous","despotic","rigorous","onerous","exigent"]
  },
  {
    id: "wasteful",
    title: "Wasteful & Extravagant",
    gist: "Burning through resources without care.",
    words: ["extravagant","profligate","prodigal","spendthrift","lavish","decadent","squander","gratuitous"]
  },
  {
    id: "friendly",
    title: "Friendly & Sociable",
    gist: "Warm, welcoming, good company.",
    words: ["cordial","congenial","convivial","amicable","gregarious","urbane","comity","affable","genial"]
  },
  {
    id: "unfriendly",
    title: "Unfriendly & Hostile",
    gist: "Cold, dismissive, or actively against.",
    words: ["aloof","antipathy","animosity","enmity","churlish","boorish","belligerent","inimical","misanthropic","truculent","abrasive"]
  },
  {
    id: "thorough",
    title: "Thorough & Meticulous",
    gist: "Careful attention to every detail.",
    words: ["meticulous","scrupulous","exhaustive","painstaking","fastidious","punctilious","sedulous","encyclopedic","rigor","assiduous","thorough","sedulous"]
  },
  {
    id: "summarize",
    title: "Summarize & Make Brief",
    gist: "Boiling down to essentials.",
    words: ["distill","synoptic","succinct","pithy","terse","laconic","brevity","economy","concise","abridge"]
  },
  {
    id: "support",
    title: "Support & Reinforce",
    gist: "Backing, strengthening, holding up.",
    words: ["corroborate","bolster","buttress","advocate","champion","substantiate","fortify","underscore","sanction","endow","render"]
  },
  {
    id: "undermine",
    title: "Undermine & Subvert",
    gist: "Quietly weakening from below.",
    words: ["undermine","subvert","attenuate","vitiate","compromise","encroach","contravene","circumvent","impugn","impair","tarnish","sully","jeopardize","derogate","insidious"]
  },
  {
    id: "puzzle",
    title: "Puzzle & Confuse",
    gist: "Throwing someone off; making bewildered.",
    words: ["confound","flummoxed","befuddled","perplex","nonplussed","discomfit","quandary","imbroglio","obfuscate"]
  },
  {
    id: "improve",
    title: "Improve & Refine",
    gist: "Making something better, smoother, finer.",
    words: ["ameliorate","mitigate","refine","burnish","edify","amend","alleviate","temper","invigorate","ennoble"]
  },
  {
    id: "spread",
    title: "Spread, Scatter, Diffuse",
    gist: "Distributing widely or dissipating.",
    words: ["disseminate","propagate","diffuse","disperse","proliferate","permeate","pervasive","rampant","rife","profuse"]
  },
  {
    id: "obstruct",
    title: "Obstruct & Hinder",
    gist: "Blocking, slowing, getting in the way.",
    words: ["impede","hinder","hamper","inhibit","stymie","thwart","foil","preclude","encumber","manacle","occlude"]
  },
];

// Build a reverse index: word → cluster IDs
function clustersForWord(word) {
  const lower = word.toLowerCase();
  return CLUSTERS.filter(c => c.words.some(w => w.toLowerCase() === lower)).map(c => c.id);
}

// Extension words used in clusters that aren't in the main GregMat 37×30 list.
// These are GRE-adjacent synonyms included to make each cluster feel complete.
const EXTRA_DEFS = {
  // Praise / Criticize family
  "commend": "praise formally",
  "disparage": "regard or speak of as having little worth",
  "vilify": "speak about in an abusively disparaging way",

  // Quiet family
  "reserved": "slow to reveal emotion or opinions",

  // Stubborn family
  "tenacious": "tending to keep a firm hold; persistent",

  // Greedy family
  "stinting": "being grudging or frugal; ungenerous",

  // Cowardly family
  "trepidation": "a feeling of fear or agitation about something",
  "timid": "showing a lack of courage or confidence",

  // Inexperienced family
  "amateur": "a person who engages in a pursuit on an unpaid basis",
  "novice": "a person new to and inexperienced in a job or situation",

  // Honest family
  "forthright": "direct and outspoken; straightforward",
  "sincere": "free from pretense or deceit",

  // Lessen family
  "dwindle": "diminish gradually in size or amount",

  // Begin family
  "embryonic": "in an early stage of development; rudimentary",
  "incipient": "in an initial stage; beginning to happen",

  // Happy family
  "jovial": "cheerful and friendly",

  // Sad family
  "melancholy": "a deep, often long-lasting sadness",
  "doleful": "expressing sorrow; mournful",
  "sullen": "bad-tempered and sulky",
  "brood": "think deeply about something that makes one unhappy",
  "forlorn": "pitifully sad and abandoned",

  // Short-lived family
  "fleeting": "lasting for a very short time",
  "temporary": "lasting for only a limited period",

  // Foolish family
  "fatuous": "silly and pointless",
  "inane": "silly; stupid; without significance",

  // Confusing family
  "ambiguous": "open to more than one interpretation",
  "cryptic": "having a meaning that is mysterious or obscure",
  "nebulous": "unclear, vague, or ill-defined",

  // Clear family
  "perspicuous": "(of writing or speech) clearly expressed and easy to understand",
  "transparent": "easy to perceive or detect; see-through",

  // Chaotic family
  "tumultuous": "making a loud, confused noise; uproarious",

  // Showy family
  "grandiose": "impressive and imposing in appearance, often pretentiously so",

  // Plain family
  "stark": "severe or bare in appearance; complete",

  // Corrupt family
  "ignoble": "not honorable in character or purpose",
  "corrupt": "having or showing a willingness to act dishonestly for personal gain",

  // Predict family
  "augur": "be a sign or omen of a particular outcome",

  // Open family
  "explicit": "stated clearly and in detail",

  // Accept family
  "concede": "admit or agree that something is true after first denying or resisting",

  // Certain family
  "irrefutable": "impossible to disprove",
  "incontestable": "not able to be disputed",

  // Harmful family
  "baleful": "threatening harm; menacing",

  // Arrogant family
  "supercilious": "behaving as though one thinks one is superior to others",

  // Humble family
  "unassuming": "not pretentious or arrogant; modest",

  // Indifferent family
  "insouciant": "showing a casual lack of concern",

  // Strict family
  "rigorous": "extremely thorough, exhaustive, or accurate",

  // Friendly family
  "affable": "friendly, good-natured, or easy to talk to",
  "genial": "friendly and cheerful",

  // Thorough family
  "assiduous": "showing great care and perseverance",

  // Summarize family
  "concise": "giving a lot of information clearly and in a few words",
  "abridge": "shorten without losing the sense",

  // Support family
  "fortify": "strengthen against attack or opposition",

  // Undermine family
  "sully": "damage the purity or integrity of",
  "derogate": "detract from; disparage",

  // Improve family
  "ennoble": "lend greater dignity or nobility to",

  // Spread family
  "permeate": "spread throughout something; pervade",

  // Obstruct family
  "stymie": "prevent or hinder the progress of",
  "thwart": "prevent (someone) from accomplishing something",
  "encumber": "restrict or burden in such a way that free action or movement is difficult",
};
