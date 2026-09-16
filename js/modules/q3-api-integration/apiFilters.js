/**
 * Q3 API Filter & Search Utility
 * Filters user records in-memory across search query and city selection.
 */

export function filterUsers(users, query = '', cityFilter = 'all') {
  if (!Array.isArray(users)) return [];

  const cleanQuery = (query || '').toLowerCase().trim();
  const cleanCity = (cityFilter || 'all').toLowerCase().trim();

  return users.filter(user => {
    // 1. City Filter matching
    const userCity = (user.address?.city || '').toLowerCase().trim();
    const matchesCity = cleanCity === 'all' || userCity === cleanCity;

    if (!matchesCity) return false;

    // 2. Search Query matching (name, username, email, phone, city, company)
    if (!cleanQuery) return true;

    const name = (user.name || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const phone = (user.phone || '').toLowerCase();
    const city = userCity;
    const company = (user.company?.name || '').toLowerCase();

    return (
      name.includes(cleanQuery) ||
      username.includes(cleanQuery) ||
      email.includes(cleanQuery) ||
      phone.includes(cleanQuery) ||
      city.includes(cleanQuery) ||
      company.includes(cleanQuery)
    );
  });
}

