const provinces = {
  Kigali: {
    districts: {
      Gasabo: ["Bumbogo", "Gatsata", "Gikomero", "Gisozi", "Jabana", "Jali", "Kacyiru", "Kimihurura", "Kimironko", "Kinyinya", "Ndera", "Nduba", "Remera", "Rusororo", "Rutunga"],
      Kicukiro: ["Gahanga", "Gatenga", "Gikondo", "Kagarama", "Kanombe", "Kicukiro", "Kigarama", "Masaka", "Niboye", "Nyarugunga"],
      Nyarugenge: ["Gitega", "Kanyinya", "Kigali", "Kimisagara", "Mageragere", "Muhima", "Nyakabanda", "Nyamirambo", "Nyarugenge", "Rwezamenyo"]
    }
  },
  Northern: {
    districts: {
      Burera: ["Bungwe", "Butaro", "Cyanika", "Cyeru", "Gahunga", "Gatebe", "Gitovu", "Kagogo", "Kinoni", "Kinyababa", "Kivuye", "Ruhunde"],
      Gakenke: ["Busengo", "Coko", "Cyabingo", "Gakenke", "Gashenyi", "Janja", "Kamubuga", "Karambo", "Kivuruga", "Mataba", "Minazi", "Muhondo", "Muyongwe", "Muzo"],
      Gicumbi: ["Bukure", "Bwisige", "Byumba", "Cyumba", "Giti", "Kageyo", "Kaniga", "Manyagiro", "Miyove", "Mukarange", "Muko", "Rutare"],
      Musanze: ["Busogo", "Cyuve", "Gacaca", "Gashaki", "Gataraga", "Kimonyi", "Kinigi", "Muhoza", "Muko", "Musanze", "Nkotsi", "Nyange"],
      Rulindo: ["Base", "Burega", "Bushoki", "Buyoga", "Cyinzuzi", "Cyungo", "Kinihira", "Kisaro", "Masoro", "Mbogo", "Murambi", "Rusiga"]
    }
  },
  Southern: {
    districts: {
      Gisagara: ["Gishubi", "Kansi", "Kibilizi", "Kigembe", "Mamba", "Muganza", "Mugombwa", "Mukindo", "Musha", "Ndora"],
      Huye: ["Gishamvu", "Huye", "Karama", "Kigoma", "Kinazi", "Maraba", "Mbazi", "Mukura", "Ngoma", "Rusatira"],
      Kamonyi: ["Gacurabwenge", "Karama", "Kayenzi", "Kibangu", "Kigembe", "Mugina", "Nyamiyaga", "Runda", "Rukoma", "Ruyenzi"],
      Muhanga: ["Cyezusa", "Kabacuzi", "Kibangu", "Kiyumba", "Muhanga", "Mushishiro", "Nyabinoni", "Nyamabuye", "Nyarusange", "Rongi"],
      Nyamagabe: ["Buruhukiro", "Cyanika", "Gasaka", "Gatare", "Kaduha", "Kamegeri", "Kibirizi", "Kibumbwe", "Kitabi", "Mbazi"],
      Nyanza: ["Busasamana", "Busoro", "Cyabakamyi", "Kibirizi", "Kigoma", "Mukingo", "Muyira", "Ntyazo", "Nyagisozi", "Rwabicuma"],
      Nyaruguru: ["Cyahinda", "Busanze", "Kibeho", "Kivu", "Mata", "Muganza", "Munini", "Ngera", "Ngoma", "Nyabimata"],
      Ruhango: ["Bweramana", "Byimana", "Kabagali", "Kinazi", "Kinihira", "Mbuye", "Mwendo", "Ntongwe"]
    }
  },
  Eastern: {
    districts: {
      Bugesera: ["Gashora", "Juru", "Kamabuye", "Mareba", "Mayange", "Musenyi", "Mwogo", "Ngeruka", "Nyamata", "Nyarugenge", "Rilima", "Ruhuha", "Rweru", "Shyara"],
      Gatsibo: ["Gasange", "Gatsibo", "Gitoki", "Kabarore", "Kageyo", "Kiramuruzi", "Kiziguro", "Muhura", "Murambi", "Ngarama"],
      Kayonza: ["Gahini", "Kabare", "Kabarondo", "Mukarange", "Murama", "Murundi", "Mwiri", "Ndego", "Nyamirama", "Rukara"],
      Kirehe: ["Gahara", "Gatore", "Kigarama", "Kigina", "Kirehe", "Mahama", "Mpanga", "Musaza", "Nasho", "Nyamugari", "Nyarubuye"],
      Ngoma: ["Gashanda", "Jarama", "Karembo", "Kazo", "Kibungo", "Mugesera", "Murama", "Mutenderi", "Remera", "Rukira", "Rukumberi", "Rurenge", "Sake", "Zaza"],
      Nyagatare: ["Gatunda", "Karama", "Karangazi", "Katabagemu", "Kiyombe", "Matimba", "Mimuli", "Mukama", "Musheri", "Nyagatare", "Rwempasha", "Rwimiyaga", "Tabagwe"],
      Rwamagana: ["Fumbwe", "Gahengeri", "Gishari", "Karenge", "Kigabiro", "Muhazi", "Munyaga", "Munyiginya", "Musha", "Muyumbu", "Mwulire", "Nyakariro", "Nzige", "Rubona"]
    }
  },
  Western: {
    districts: {
      Karongi: ["Bwishyura", "Gishari", "Gishyita", "Gitesi", "Mubuga", "Murambi", "Murundi", "Mutuntu", "Rubengera", "Rugabano", "Ruganda", "Rwankuba", "Twumba"],
      Ngororero: ["Bwira", "Gatumba", "Hindiro", "Kabaya", "Kageyo", "Kavumu", "Matyazo", "Muhanda", "Muhororo", "Ndaro", "Ngororero", "Nyange"],
      Nyabihu: ["Bigogwe", "Jenda", "Jomba", "Kabatwa", "Karago", "Kintobo", "Mukamira", "Muringa", "Rambura", "Rugera", "Rurembo", "Shyira"],
      Nyamasheke: ["Bushigishigi", "Bugeshi", "Cyato", "Gatondori", "Kavumu", "Kigatare", "Kigina", "Kivu", "Makurizo", "Mugera", "Mukondo", "Murangazi", "Nyabitekeri", "Rangiro"],
      Rubavu: ["Bugeshi", "Busasamana", "Cyanzarwe", "Gisenyi", "Kanama", "Kanzenze", "Mudende", "Nyakiliba", "Nyamyumba", "Nyundo", "Rubavu", "Rugerero"],
      Rusizi: ["Bugarama", "Butare", "Bweyeye", "Gikundamvura", "Gashonga", "Giheke", "Gwem", "Kamenbe", "Kamembe", "Kigogwe", "Muganza", "Mururu", "Nkanka", "Nkombo", "Nkungu", "Nyakabuye", "Nyakarenzo"],
      Rutsiro: ["Boneza", "Gihango", "Kigeyo", "Kivumu", "Manihira", "Mukura", "Murunda", "Musasa", "Mushonyi", "Mushubuli", "Nyabirasi", "Ruhango", "Rusebeya"]
    }
  }
};

export function getProvinces() {
  return Object.keys(provinces);
}

export function getDistricts(province) {
  if (!province || !provinces[province]) return [];
  return Object.keys(provinces[province].districts);
}

export function getSectors(province, district) {
  if (!province || !district || !provinces[province]) return [];
  const dist = provinces[province].districts[district];
  return dist || [];
}

export default provinces;
