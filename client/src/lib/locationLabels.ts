const LOCATION_LABELS: Record<string, any> = {
  Tapion: "Tapion",
  sunnyAcres: "Sunny Acres",
  blueCoral: "Blue Coral",
  emCare: "Em-Care",
  RodeneyBay: "Rodney Bay",
  memberCare: "Member-Care",
  vieuxFort: "Vieux-Fort",
  soufriere: "Soufriere",
  manoelStreet: "Manoel Street",
  other: "Other"
}

export function locationLabels(location?: string | null) {
  if (!location) return "-";
  return LOCATION_LABELS[location] ?? location.replace(/([a-z])([A-Z])/g, "$1 $2")
}