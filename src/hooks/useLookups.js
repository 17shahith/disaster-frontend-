import { useCallback, useEffect, useState } from 'react';
import incidentService from '../services/incidentService';
import requestService from '../services/requestService';
import teamService from '../services/teamService';
import shelterService from '../services/shelterService';
import supplyService from '../services/supplyService';
import allocationService from '../services/allocationService';
import userService from '../services/userService';

const LOADERS = {
  leads: userService.getTeamLeads, // administrator only
  incidents: incidentService.getAll,
  requests: requestService.getAll,
  teams: teamService.getAll,
  shelters: shelterService.getAll,
  supplies: supplyService.getAll,
  allocations: allocationService.getAll,
};

/**
 * Loads reference lists (for dropdowns and name lookups).
 * Usage: const { lookups, reloadLookups } = useLookups(['incidents', 'teams']);
 */
export default function useLookups(keys) {
  const keyString = keys.join(',');
  const [lookups, setLookups] = useState(() => Object.fromEntries(keys.map((k) => [k, []])));
  const [loaded, setLoaded] = useState(false);

  const reloadLookups = useCallback(async () => {
    const names = keyString ? keyString.split(',') : [];
    const results = await Promise.allSettled(names.map((k) => LOADERS[k]()));
    setLookups(Object.fromEntries(names.map((k, i) => [k, results[i].status === 'fulfilled' ? results[i].value : []])));
    setLoaded(true);
  }, [keyString]);

  useEffect(() => {
    reloadLookups();
  }, [reloadLookups]);

  return { lookups, reloadLookups, loaded };
}

/** Finds a display name for an id within a lookup list. */
export const lookupName = (list, id, fallback = '—') => {
  if (!id) return fallback;
  const item = list?.find((x) => x.id === id);
  return item ? item.title || item.name || item.requesterName || item.id : id;
};
