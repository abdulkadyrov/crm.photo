// Each constituent list remains protected by the existing account/project API.
export function createMultiProjectPrintRequest(request) {
  const snapshots = new Map();
  const idsFor = id => id.slice(6).split('_');
  function combine(id, parts) {
    parts.forEach(part => snapshots.set(part.id, part));
    return {
      id, projectId: '', groupId: '', title: 'Все проекты', allProjects: true,
      revision: parts.reduce((sum, part) => sum + part.revision, 0),
      ready: parts.every(part => part.ready),
      groups: parts.flatMap(part => part.groups.map(group => ({...group, name: `${part.title} · ${group.name}`}))),
      students: parts.flatMap(part => part.students),
      works: parts.flatMap(part => part.works.map(work => ({...work, projectId: part.projectId}))),
      items: parts.flatMap(part => part.items)
    };
  }
  return async (method, id, body, revision) => {
    if (!id && body?.projectIds) {
      // Sequential creation avoids leaving untracked requests after one failure.
      const parts = [];
      for (const projectId of [...new Set(body.projectIds)]) parts.push(await request('POST', '', {projectId}));
      return combine('multi_' + parts.map(part => part.id).join('_'), parts);
    }
    if (!id?.startsWith('multi_')) return request(method, id, body, revision);
    const ids = idsFor(id);
    let parts = await Promise.all(ids.map(sid => request('GET', sid)));
    if (method === 'POST') {
      if (body.action === 'ready') parts = await Promise.all(ids.map(sid => request('POST', sid, body)));
      else {
        const owner = parts.find(part => part.works.some(work => work.id === body.workId) || part.items.some(item => item.workId === body.workId));
        if (!owner) throw new Error('Работа недоступна в выбранных проектах');
        const next = await request('POST', owner.id, body);
        parts = parts.map(part => part.id === owner.id ? next : part);
      }
    }
    const snapshot = combine(id, parts);
    return method === 'GET' && snapshot.revision === revision ? {unchanged: true, revision} : snapshot;
  };
}
