export function branchClass(name = '') {
  if (!name) return 'branch-fernhollow';
  const lower = name.toLowerCase();
  if (lower.includes('fern')) return 'branch-fernhollow';
  if (lower.includes('mist')) return 'branch-mistgrove';
  if (lower.includes('bramble')) return 'branch-bramblewick';
  if (lower.includes('engineering')) return 'branch-mistgrove';
  if (lower.includes('research')) return 'branch-bramblewick';
  return 'branch-fernhollow';
}

export function displayBranch(name = '') {
  if (!name) return '';
  return name
    .replace('Central Library', 'Fernhollow Branch')
    .replace('Engineering Library', 'Mistgrove Branch')
    .replace('Research Library', 'Bramblewick Branch');
}

