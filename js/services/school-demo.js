export const SCHOOL_DEMO_ID = 'demo-school-ten-classes-v1';
export const MARTIAL_SERVICES = [
  ['boxing', 'Бокс'], ['freestyle-wrestling', 'Вольная борьба'], ['judo', 'Дзюдо'], ['karate', 'Карате']
].map(([key, title]) => ({ id: `school-sport-${key}`, title, name: title, category: 'Единоборства', mediaKind: 'photo', price: '350', angles: [
  { id: 'portrait', name: 'Портрет', details: 'Лицо открыто, взгляд в камеру.' },
  { id: 'full', name: 'Стойка в полный рост', details: 'Спортивная стойка, руки и стопы целиком в кадре.' }
] }));
const THEMES = ['child-boy-pirate-captain', 'child-girl-fairytale-princess', 'child-boy-chechen-stone-tower', 'child-girl-chechen-waterfall', 'child-boy-chechen-horse-valley', 'child-girl-horse-rider-headscarf', 'child-boy-medieval-knight', 'child-girl-forest-fairy', 'child-boy-dragon-friend', 'child-girl-ballerina-princess', 'child-boy-football-champion', 'child-girl-ice-queen', 'child-boy-rescue-unit', 'child-girl-long-haired-tower-princess', 'child-boy-chechen-waterfall', 'child-girl-chechen-stone-tower'];
const NAMES = ['Артём Соколов','Алина Орлова','Тимур Волков','Милана Белова','Даниил Морозов','София Лебедева','Матвей Новиков','Ева Кузнецова','Адам Попов','Полина Соколова','Марк Васильев','Амина Павлова','Лев Петров','Вера Смирнова','Илья Егоров','Анна Захарова','Руслан Макаров','Максим Фёдоров','Денис Громов','Алексей Крылов'];
export function schoolDemoRecords(catalog) {
  const services = [...THEMES.map(id => catalog.find(s => s.id === id)), ...MARTIAL_SERVICES];
  if (services.some(s => !s)) throw new Error('Каталог ещё не загружен. Перезапустите приложение.');
  const records = {projects: [{id: SCHOOL_DEMO_ID, name: 'Демо · Школьная фотосъёмка', classSort:'numeric', createdAt: new Date().toISOString(), demo: true}], classes: [], students: [], orders: []};
  for (let n = 0; n < 10; n++) records.classes.push({id: `${SCHOOL_DEMO_ID}-class-${n+1}`, projectId: SCHOOL_DEMO_ID, name: `${n+1}А`});
  services.forEach((service, i) => {
    const id = `${SCHOOL_DEMO_ID}-student-${i+1}`;
    const [firstName,lastName] = NAMES[i].split(' ');
    records.students.push({id, firstName, lastName, age: 7 + Math.floor(i*10/19), classId: records.classes[Math.floor(i/2)].id, qrId:id, paymentStatus:'unpaid', catalogId:service.id, catalogIds:[service.id], selectedServices:[{serviceId:service.id, quantity:1, comment:''}]});
    records.orders.push({id:`order_${id}`, studentId:id, catalogId:service.id, items:service.angles.map(a=>({type:`${service.id}__${a.id}`,label:`${service.title}: ${a.name}`,status:'pending',fileIds:[]}))});
  });
  return records;
}
// One transaction makes double clicks/tabs idempotent and never clears existing data.
export function addSchoolDemo(db, catalog) {
  const records = schoolDemoRecords(catalog);
  return new Promise((resolve,reject) => {
    const tx = db.transaction([...Object.keys(records),'catalog'], 'readwrite');
    tx.oncomplete=()=>resolve(SCHOOL_DEMO_ID);
    tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error);
    tx.objectStore('projects').get(SCHOOL_DEMO_ID).onsuccess=e=>{
      if(e.target.result)return;
      for(const [store,rows] of Object.entries(records)) for(const row of rows) tx.objectStore(store).add(row);
      for(const service of MARTIAL_SERVICES) tx.objectStore('catalog').get(service.id).onsuccess=e=>{if(!e.target.result)tx.objectStore('catalog').add(service);};
    };
  });
}
