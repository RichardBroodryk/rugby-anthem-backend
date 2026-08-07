const COMPETITION_MAP = new Map([
  // ==================================================
  // MEN — INTERNATIONAL
  // ==================================================

  ["six nations", "six-nations"],
  ["rugby championship", "rugby-championship"],
  ["rugby world cup", "world-cup"],
  ["autumn nations series", "autumn-nations"],
  ["summer internationals", "summer-internationals"],
  ["international tests", "international-tests"],
  ["friendly international", "international-tests"],
["friendly internationals", "international-tests"],

["nations championship", "nations-championship"],
["rugby world cup", "world-cup"],
["world cup", "world-cup"],

["lions tour", "lions-tour"],
  ["world rugby nations cup", "world-rugby-nations-cup"],
  ["pacific nations cup", "pacific-nations"],

  // ==================================================
  // WOMEN — INTERNATIONAL
  // ==================================================

  ["women's six nations", "six-nations-women"],
  ["womens six nations", "six-nations-women"],
  ["women's rugby world cup", "world-cup-women"],
  ["womens rugby world cup", "world-cup-women"],
  ["women's international tests", "womens-internationals"],
  ["womens international tests", "womens-internationals"],
  ["wxv 1", "wxv1"],
  ["wxv1", "wxv1"],

  // ==================================================
  // DOMESTIC — MEN
  // ==================================================

  ["united rugby championship", "urc"],
  ["premiership rugby", "premiership"],
  ["top 14", "top-14"],
  ["super rugby", "super-rugby"],
  ["pro d2", "pro-d2"],
  ["pro d2 rugby", "pro-d2"],
  ["japan league one", "japan-league-one"],
  ["major league rugby", "mlr"],

  // New Zealand
  ["bunnings npc", "npc"],
  ["npc", "npc"],

  // Europe
  ["investec champions cup", "champions-cup"],
  ["epcr challenge cup", "challenge-cup"],

  // ==================================================
  // WOMEN — DOMESTIC
  // ==================================================

  ["premier 15s", "premier-15s"],
  ["super rugby women", "super-rugby-women"],
  ["super rugby aupiki", "aupiki"],
  ["elite 1 women", "elite-1-women"],

  // ==================================================
  // SEVENS
  // ==================================================

  ["svns", "svns-series"],
  ["svns series", "svns-series"],
  ["sevens world cup", "sevens-world-cup"],
  ["olymic sevens", "olymics-sevens"],
  ["olymic rugby sevens", "olymics-sevens"],
  ["olympic sevens", "olymics-sevens"],
  ["olympic rugby sevens", "olymics-sevens"],
]);

function normalizeLeagueName(name = "") {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[']/g, "")
    .replace(/\s+/g, " ");
}

function resolveCompetitionId(league) {
  if (!league) {
    return "unknown";
  }

  const key = normalizeLeagueName(league.name || "");

  return COMPETITION_MAP.get(key) || "unknown";
}

module.exports = {
  resolveCompetitionId,
};