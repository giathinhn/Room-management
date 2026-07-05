/**
 * Translates a room's name, location, and equipment dynamically using the active i18next translation function.
 * Falls back to the original string if no translation is defined.
 *
 * @param {object} room - The room object
 * @param {function} t - The i18next translation function
 */
export function translateRoom(room, t) {
  if (!room) return room;

  const translateKey = (ns, val) => {
    if (!val) return val;
    const key = `roomsData.${ns}.${val}`;
    const translated = t(key);
    if (translated === key || !translated) return val;
    return translated;
  };

  return {
    ...room,
    name: translateKey('names', room.name),
    location: translateKey('locations', room.location),
    equipment: Array.isArray(room.equipment)
      ? room.equipment.map((eq) => translateKey('equipment', eq))
      : room.equipment,
  };
}
