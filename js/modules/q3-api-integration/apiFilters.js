/**
 * Q3 API Filter & Search Utility
 */

export function filterUsers(users, query = '', cityFilter = 'all') {
  if (!Array.isArray(users)) return [];

  const cleanQuery = query.toLowerCase().trim();

  return users.filter(user => {
    // City filter
    const matchesCity = cityFilter === 'all' || 
      (user.address && user.address.city && user.address.city.toLowerCase() === cityFilter.toLowerCase());

    if (!matchesCity) return false;

    // Search query filter
    if (!cleanQuery) return true;

    const name = (user.name || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const company = (user.company?.name || '').toLowerCase();
    const phone = (user.phone || '').toLowerCase();

    return (
      name.includes(cleanQuery) ||
      username.includes(cleanQuery) ||
      email.includes(cleanQuery) ||
      company.includes(cleanQuery) ||
      phone.includes(cleanQuery)
    );
  });
}
