// Repair the production overlay without replacing its newer photo/print workflows.
export function repairStandardScanner(source) {
 const start=source.indexOf('function cloudScanJournal() {');
 const ending='  groupScanCloudStore.start();return groupScanCloudStore;\n}';
 const end=source.indexOf(ending,start)+ending.length;
 const capture=source.indexOf('async function persistStudentMedia(file, target, id) {');
 if(start<0||end<ending.length||capture<0||source.indexOf('function cloudScanJournal() {',start+1)>=0)throw new Error('Unexpected scanner overlay; inspect before patching');
 if(start<capture)return source;
 const journal=source.slice(start,end);
 const without=source.slice(0,start)+source.slice(end);
 return without.slice(0,capture)+journal+'\n\n'+without.slice(capture);
}
