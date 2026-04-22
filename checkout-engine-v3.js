console.log('%c🚀 ADDI CORE ENGINE V3.0 ACTIVATED', 'color: #00ff00; font-weight: bold; font-size: 16px; background: black; padding: 5px;');
// ==================== CHECKOUT LOGIC FOR ADDI ====================

let checkoutCart = [];
const DEFAULT_SHIPPING_COST = 16500;
const FREE_SHIPPING_THRESHOLD = 250000;

const colombiaCities = {
    "Amazonas": ["Leticia", "Puerto Nariño", "El Encanto", "La Chorrera", "Puerto Alegría", "Puerto Arica"],
    "Antioquia": ["Medellín", "Abejorral", "Abriaquí", "Alejandría", "Amagá", "Amalfi", "Andes", "Angelópolis", "Angostura", "Anorí", "Anzá", "Apartadó", "Arboletes", "Argelia", "Armenia", "Barbosa", "Bello", "Belmira", "Betania", "Betulia", "Briceño", "Buritica", "Caicedo", "Caldas", "Campamento", "Cañasgordas", "Caracolí", "Caramanta", "Carepa", "Carmen de Viboral", "Carolina del Príncipe", "Caucasia", "Chigorodó", "Cisneros", "Ciudad Bolívar", "Cocorná", "Concepción", "Concordia", "Copacabana", "Dabeiba", "Donmatías", "Ebéjico", "El Bagre", "El Carmen de Viboral", "El Peñol", "El Retiro", "El Santuario", "Entrerríos", "Envigado", "Fredonia", "Frontino", "Giraldo", "Girardota", "Gómez Plata", "Granada", "Guadalupe", "Guarne", "Guatapé", "Heliconia", "Hispania", "Itagüí", "Ituango", "Jardín", "Jericó", "La Ceja", "La Estrella", "La Pintada", "La Unión", "Liborina", "Maceo", "Marinilla", "Montebello", "Murindó", "Mutatá", "Nariño", "Nechí", "Necoclí", "Olaya", "Peñol", "Peque", "Pueblorrico", "Puerto Berrío", "Puerto Nare", "Puerto Triunfo", "Remedios", "Retiro", "Rionegro", "Sabanalarga", "Sabaneta", "Salgar", "San Andrés de Cuerquia", "San Carlos", "San Francisco", "San Jerónimo", "San José de la Montaña", "San Juan de Urabá", "San Luis", "San Pedro de los Milagros", "San Pedro de Urabá", "San Rafael", "San Roque", "San Vicente", "Santa Bárbara", "Santa Fe de Antioquia", "Santa Rosa de Osos", "Santo Domingo", "Santuario", "Segovia", "Sonson", "Sopetrán", "Támesis", "Tarazá", "Tarso", "Titiribí", "Toledo", "Turbo", "Uramita", "Urrao", "Valdivia", "Valparaíso", "Vegachí", "Venecia", "Vigía del Fuerte", "Yalí", "Yarumal", "Yolombó", "Yondó", "Zaragoza"],
    "Arauca": ["Arauca", "Arauquita", "Cravo Norte", "Fortul", "Puerto Rondón", "Saravena", "Tame"],
    "Atlántico": ["Barranquilla", "Baranoa", "Campo de la Cruz", "Candelaria", "Galapa", "Juan de Acosta", "Luruaco", "Malambo", "Manatí", "Palmar de Varela", "Piojó", "Polonuevo", "Ponedera", "Puerto Colombia", "Repelón", "Sabanagrande", "Sabanalarga", "Santa Lucía", "Santo Tomás", "Soledad", "Suan", "Tubará", "Usiacurí"],
    "Bogotá DC": ["Bogotá DC"],
    "Bolívar": ["Cartagena de Indias", "Achí", "Altos del Rosario", "Arenal", "Arjona", "Arroyohondo", "Barranco de Loba", "Calamar", "Cantagallo", "Cicuco", "Clemencia", "Córdoba", "El Carmen de Bolívar", "El Guamo", "El Peñón", "Hatillo de Loba", "Magangué", "Mahates", "Margarita", "María la Baja", "Mompós", "Montecristo", "Morales", "Norosí", "Pinillos", "Regidor", "Río Viejo", "San Cristóbal", "San Estanislao", "San Fernando", "San Jacinto", "San Jacinto del Cauca", "San Juan Nepomuceno", "San Martín de Loba", "San Pablo", "Santa Catalina", "Santa Rosa", "Santa Rosa del Sur", "Simití", "Soplaviento", "Talaigua Nuevo", "Tiquisio", "Turbaco", "Turbaná", "Villanueva", "Zambrano"],
    "Boyacá": ["Tunja", "Almeida", "Aquitania", "Arcabuco", "Belén", "Berbeo", "Betéitiva", "Boavita", "Boyacá", "Briceño", "Buenavista", "Busbanzá", "Caldas", "Campohermoso", "Cerinza", "Chinavita", "Chiquinquirá", "Chíquiza", "Chiscas", "Chita", "Chitaraque", "Chivatá", "Chivor", "Ciénega", "Cómbita", "Coper", "Corrales", "Covarachía", "Cubará", "Cucaita", "Cuítiva", "Duitama", "El Cocuy", "El Espino", "Firavitoba", "Floresta", "Gachantivá", "Gámeza", "Garagoa", "Guacamayas", "Guateque", "Guayatá", "Güicán", "Iza", "Jenesano", "Jericó", "La Capilla", "La Uvita", "La Victoria", "Labranzagrande", "Macanal", "Maripí", "Miraflores", "Mongua", "Monguí", "Moniquirá", "Motavita", "Muzo", "Nobsa", "Nuevo Colón", "Oicatá", "Otanche", "Pachavita", "Páez", "Paipa", "Pajarito", "Panqueba", "Pauna", "Paya", "Paz de Río", "Pesca", "Pisba", "Puerto Boyacá", "Quípama", "Ramiriquí", "Ráquira", "Rondón", "Saboyá", "Sáchica", "Samacá", "San Eduardo", "San José de Pare", "San Luis de Gaceno", "San Mateo", "San Miguel de Sema", "San Pablo de Borbur", "Santa María", "Santa Rosa de Viterbo", "Santa Sofía", "Santana", "Sativanorte", "Sativasur", "Siachoque", "Soatá", "Socha", "Socotá", "Sogamoso", "Somondoco", "Sora", "Soracá", "Sotaquirá", "Susacón", "Sutamarchán", "Sutatenza", "Tasco", "Tenza", "Tibaná", "Tibasosa", "Tinjacá", "Tipacoque", "Toca", "Togüí", "Tópaga", "Tota", "Tununguá", "Turmequé", "Tuta", "Tutazá", "Umbita", "Ventaquemada", "Villa de Leyva", "Viracachá", "Zetaquira"],
    "Caldas": ["Manizales", "Aguadas", "Anserma", "Aranzazu", "Belalcázar", "Chinchiná", "Filadelfia", "La Dorada", "La Merced", "Manzanares", "Marmato", "Marquetalia", "Marulanda", "Neira", "Norcasia", "Pácora", "Palestina", "Pensilvania", "Riosucio", "Risaralda", "Salamina", "Samaná", "San José", "Supía", "Victoria", "Villamaría", "Viterbo"],
    "Caquetá": ["Florencia", "Albania", "Belén de los Andaquíes", "Cartagena del Chairá", "Curillo", "El Doncello", "El Paujil", "La Montañita", "Milán", "Morelia", "Puerto Rico", "San José del Fragua", "San Vicente del Caguán", "Solano", "Solita", "Valparaíso"],
    "Casanare": ["Yopal", "Aguazul", "Chámeza", "Hato Corozal", "La Salina", "Maní", "Monterrey", "Nunchía", "Orocué", "Paz de Ariporo", "Pore", "Recetor", "Sabanalarga", "Sácama", "San Luis de Palenque", "Támara", "Tauramena", "Trinidad", "Villanueva"],
    "Cauca": ["Popayán", "Almaguer", "Argelia", "Balboa", "Bolívar", "Buenos Aires", "Cajibío", "Caldono", "Caloto", "Corinto", "El Tambo", "Florencia", "Guachené", "Guapí", "Inzá", "Jambaló", "La Sierra", "La Vega", "López de Micay", "Mercaderes", "Miranda", "Morales", "Padilla", "Páez", "Patía", "Piamonte", "Piendamó", "Puerto Tejada", "Puracé", "Rosas", "San Sebastián", "Santa Rosa", "Santander de Quilichao", "Silvia", "Sotara", "Suárez", "Sucre", "Timbiquí", "Timbío", "Toribío", "Totoró", "Villa Rica"],
    "Cesar": ["Valledupar", "Aguachica", "Agustín Codazzi", "Astrea", "Becerril", "Bosconia", "Chimichagua", "Chiriguaná", "Curumaní", "El Copey", "El Paso", "Gamarra", "González", "La Gloria", "La Jagua de Ibirico", "La Paz", "Manaure Balcón del Cesar", "Pailitas", "Pelaya", "Pueblo Bello", "Río de Oro", "La Jagua de Ibirico", "San Alberto", "San Diego", "San Martín", "Tamalameque"],
    "Chocó": ["Quibdó", "Acandí", "Alto Baudó", "Bagadó", "Bahía Solano", "Bajo Baudó", "Belén de Bajirá", "Bojoyá", "Carmen del Darién", "Cértegui", "Condoto", "El Atrato", "El Cantón del San Pablo", "El Carmen de Atrato", "El Litoral del San Juan", "Istmina", "Juradó", "Lloró", "Medio Atrato", "Medio Baudó", "Medio San Juan", "Novita", "Nuquí", "Río Iró", "Río Quito", "Riosucio", "San José del Palmar", "Sipí", "Tadó", "Unguía", "Unión Panamericana"],
    "Córdoba": ["Montería", "Ayapel", "Buenavista", "Canalete", "Cereté", "Chimá", "Chinú", "Ciénaga de Oro", "Cotorra", "La Apartada", "Lorica", "Los Córdobas", "Momil", "Montelíbano", "Moñitos", "Planeta Rica", "Pueblo Nuevo", "Puerto Escondido", "Puerto Libertador", "Purísima", "Sahagún", "San Andrés de Sotavento", "San Antero", "San Bernardo del Viento", "San Carlos", "San José de Uré", "San Pelayo", "Tierralta", "Tuchín", "Valencia"],
    "Cundinamarca": ["Agua de Dios", "Albán", "Anapoima", "Anolaima", "Apulo", "Arbeláez", "Beltrán", "Bituima", "Bojacá", "Cabrera", "Cachipay", "Cajicá", "Caparrapí", "Cáqueza", "Carmen de Carupa", "Chaguaní", "Chía", "Chipaque", "Choachí", "Chocontá", "Cogua", "Cota", "Cucunubá", "El Colegio", "El Peñón", "El Rosal", "Facatativá", "Fómeque", "Fosca", "Funza", "Fúquene", "Fusagasugá", "Gachalá", "Gachancipá", "Gachetá", "Gama", "Girardot", "Granada", "Guachetá", "Guaduas", "Guasca", "Guataquí", "Guatavita", "Guayabal de Síquima", "Guayabetal", "Gutiérrez", "Jerusalén", "Junín", "La Calera", "La Mesa", "La Palma", "La Peña", "La Victoria", "Lenguazaque", "Machetá", "Madrid", "Manta", "Medina", "Mosquera", "Nariño", "Nemocón", "Nilo", "Nimaima", "Nocaima", "Pacho", "Paime", "Pandi", "Paratebueno", "Pasca", "Puerto Salgar", "Pulí", "Quebradanegra", "Quetame", "Quipile", "Ricaurte", "San Antonio del Tequendama", "San Bernardo", "San Cayetano", "San Francisco", "San Juan de Rioseco", "Sasaima", "Sesquilé", "Sibaté", "Silvania", "Simijaca", "Soacha", "Sopó", "Subachoque", "Suesca", "Supatá", "Susa", "Sutatausa", "Tabio", "Tausa", "Tena", "Tenjo", "Tibacuy", "Tibirita", "Tocaima", "Tocancipá", "Topaipí", "Ubalá", "Ubaque", "Ubaté", "Une", "Utica", "Venecia", "Vergara", "Vianí", "Villagómez", "Villapinzón", "Villeta", "Viotá", "Yacopí", "Zipacón", "Zipaquira"],
    "Guainía": ["Inírida", "Barrancominas"],
    "Guaviare": ["San José del Guaviare", "Calamar", "El Retorno", "Miraflores"],
    "Huila": ["Neiva", "Acevedo", "Agrado", "Aipe", "Algeciras", "Altamira", "Baraya", "Campoalegre", "Colombia", "Elías", "Garzón", "Gigante", "Guadalupe", "Hobo", "Íquira", "Isnos", "La Argentina", "La Plata", "Nátaga", "Opaíra", "Paicol", "Palermo", "Palestina", "Pital", "Pitalito", "Rivera", "Saladoblanco", "San Agustín", "Santa María", "Suaza", "Tarqui", "Tello", "Teruel", "Tesalia", "Timaná", "Villavieja", "Yaguará"],
    "La Guajira": ["Riohacha", "Albania", "Barrancas", "Dibulla", "Distracción", "El Molino", "Fonseca", "Hatonuevo", "La Jagua del Pilar", "Maicao", "Manaure", "San Juan del Cesar", "Urumita", "Villanueva", "Uribia"],
    "Magdalena": ["Santa Marta", "Algarrobo", "Aracataca", "Ariguaní", "Cerro de San Antonio", "Chibolo", "Ciénaga", "Concordia", "El Banco", "El Piñón", "El Retén", "Fundación", "Guamal", "Nueva Granada", "Pedraza", "Pijiño del Carmen", "Pivijay", "Plato", "Pueblo Viejo", "Remolino", "Sabanas de San Ángel", "Salamina", "San Sebastián de Buenavista", "San Zenón", "Santa Ana", "Santa Bárbara de Pinto", "Sitionuevo", "Tenerife", "Zapayán", "Zona Bananera"],
    "Meta": ["Villavicencio", "Acacías", "Barranca de Upía", "Cabuyaro", "Castilla la Nueva", "Cubarral", "Cumaral", "El Calvario", "El Castillo", "El Dorado", "Fuente de Oro", "Granada", "Guamal", "La Macarena", "Lejanías", "Mapiripán", "Mesetas", "Puerto Concordia", "Puerto Gaitán", "Puerto Lleras", "Puerto López", "Puerto Rico", "Restrepo", "San Carlos de Guaroa", "San Juan de Arama", "San Juanito", "San Martín", "Vista Hermosa"],
    "Nariño": ["Pasto", "Albán", "Aldana", "Ancuya", "Arboleda", "Barbacoas", "Belén", "Buesaco", "Chachagüí", "Colón", "Consacá", "Contadero", "Córdoba", "Cuaspud", "Cumbal", "Cumbitara", "El Charco", "El Peñol", "El Rosario", "El Tablón de Gómez", "El Tambo", "Francisco Pizarro", "Funes", "Guachucal", "Guaitarilla", "Gualmatán", "Iles", "Imués", "Ipiales", "La Cruz", "La Florida", "La Llanada", "La Tola", "La Unión", "Leiva", "Linares", "Los Andes", "Magüí Payán", "Mallama", "Mosquera", "Nariño", "Olaya Herrera", "Ospina", "Policarpa", "Potosí", "Puerres", "Pupiales", "Ricaurte", "Roberto Payán", "Samaniego", "San Bernardo", "San Lorenzo", "San Pablo", "San Pedro de Cartago", "Sandoná", "Santa Bárbara", "Santacruz", "Sapuyes", "Taminango", "Tangua", "Tumaco", "Túquerres", "Yacuanquer"],
    "Norte de Santander": ["Cúcuta", "Ábrego", "Arboledas", "Bochalema", "Bucarasica", "Cáchira", "Cácota", "Chinácota", "Chitagá", "Convención", "Cucutilla", "Durania", "El Carmen", "El Tarra", "El Zulia", "Gramalote", "Hacarí", "Herrán", "La Esperanza", "La Playa", "Labateca", "Los Patios", "Lourdes", "Mutiscua", "Ocaña", "Pamplona", "Pamplonita", "Puerto Santander", "Ragonvalia", "Salazar de las Palmas", "San Calixto", "San Cayetano", "Santiago", "Sardinata", "Silos", "Teorama", "Tibú", "Toledo", "Villa Caro", "Villa del Rosario"],
    "Putumayo": ["Mocoa", "Colón", "Orito", "Puerto Asís", "Puerto Caicedo", "Puerto Guzmán", "Puerto Leguízamo", "San Francisco", "San Miguel", "Santiago", "Sibundoy", "Valle del Guamuez", "Villagarzón"],
    "Quindío": ["Armenia", "Buenavista", "Calarcá", "Circasia", "Córdoba", "Filandia", "Génova", "La Tebaida", "Montenegro", "Pijao", "Quimbaya", "Salento"],
    "Risaralda": ["Pereira", "Apía", "Balboa", "Belén de Umbría", "Dosquebradas", "Guática", "La Celia", "La Virginia", "Marsella", "Mistrató", "Pueblo Rico", "Quinchía", "Santa Rosa de Cabal", "Santuario"],
    "San Andrés y Providencia": ["San Andrés", "Providencia"],
    "Santander": ["Bucaramanga", "Aguada", "Albania", "Aratoca", "Barbosa", "Barichara", "Barrancabermeja", "Betulia", "Bolívar", "Cabrera", "California", "Capitanejo", "Carcasí", "Cepitá", "Cerrito", "Charalá", "Charta", "Chima", "Chipatá", "Cimitarra", "Concepción", "Confines", "Contratación", "Coromoro", "Curití", "El Carmen de Chucurí", "El Guacamayo", "El Peñón", "El Playón", "Encino", "Enciso", "Florián", "Floridablanca", "Galán", "Gambita", "Girón", "Guaca", "Guadalupe", "Guapotá", "Guavatá", "Güepsa", "Hato", "Jesús María", "Jordán", "La Belleza", "La Paz", "Landázuri", "Lebrija", "Los Santos", "Macaravita", "Málaga", "Matanza", "Mogotes", "Molagavita", "Ocamonte", "Oiba", "Onzaga", "Palmar", "Palmas del Socorro", "Páramo", "Piedecuesta", "Pinchote", "Puente Nacional", "Puerto Parra", "Puerto Wilches", "Rionegro", "Sabana de Torres", "San Andrés", "San Benito", "San Gil", "San Joaquín", "San José de Miranda", "San Miguel", "San Vicente de Chucurí", "Santa Bárbara", "Santa Helena del Opón", "Simacota", "Socorro", "Suaita", "Sucre", "Suratá", "Tona", "Valle de San José", "Vélez", "Vetas", "Villanueva", "Zapatoca"],
    "Sucre": ["Sincelejo", "Buenavista", "Caimito", "Chalán", "Colosó", "Corozal", "Coveñas", "El Roble", "Galeras", "Guaranda", "La Unión", "Los Palmitos", "Majagual", "Morroa", "Ovejas", "Palmito", "Sampués", "San Benito Abad", "San Juan de Betulia", "San Marcos", "San Onofre", "San Pedro", "Sincé", "Tolú", "Toluviejo"],
    "Tolima": ["Ibagué", "Alpujarra", "Alvarado", "Ambalema", "Anzoátegui", "Armero Guayabal", "Ataco", "Cajamarca", "Carmen de Apicalá", "Casabianca", "Chaparral", "Coello", "Coyaima", "Cunday", "Dolores", "Espinal", "Falan", "Flandes", "Fresno", "Guamo", "Herveo", "Honda", "Icononzo", "Lérida", "Líbano", "Mariquita", "Melgar", "Murillo", "Natagaima", "Ortega", "Palocabildo", "Planadas", "Prado", "Purificación", "Rioblanco", "Roncesvalles", "Rovira", "Saldaña", "San Antonio", "San Luis", "Santa Isabel", "Suárez", "Valle de San Juan", "Venadillo", "Villahermosa", "Villarrica"],
    "Valle del Cauca": ["Cali", "Alcalá", "Andalucía", "Ansermanuevo", "Argelia", "Bolívar", "Buenaventura", "Buga", "Bugalagrande", "Caicedonia", "Calima", "Candelaria", "Cartago", "Dagua", "El Cairo", "El Cerrito", "El Dovio", "Florida", "Ginebra", "Guacarí", "Jamundí", "La Cumbre", "La Unión", "La Victoria", "Obando", "Palmira", "Pradera", "Restrepo", "Riofrío", "Roldanillo", "San Pedro", "Sevilla", "Toro", "Trujillo", "Tuluá", "Ulloa", "Versalles", "Vijes", "Yotoco", "Yumbo", "Zarzal"],
    "Vaupés": ["Mitú", "Carurú", "Pacoa", "Taraira", "Papunahua", "Yavaraté"],
    "Vichada": ["Puerto Carreño", "Cumaribo", "La Primavera", "Santa Rosalía"]
};

/**
 * Update the list of cities based on the selected department
 */
function updateCities() {
    const department = document.getElementById('administrativeDivision').value;
    const citySelect = document.getElementById('city');
    citySelect.innerHTML = '<option value="">Selecciona tu municipio</option>';
    
    if (department && colombiaCities[department]) {
        // Ordenar alfabéticamente para facilitar la búsqueda
        const sortedCities = [...colombiaCities[department]].sort();
        
        sortedCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
        
        // Añadir opción de entrada manual al final
        const otherOption = document.createElement('option');
        otherOption.value = "OTRO";
        otherOption.textContent = "─ OTRO (Escribir manualmente) ─";
        citySelect.appendChild(otherOption);
    }
}

// Escuchar cambios en el selector de ciudad para mostrar campo manual
document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('city');
    const manualCityGroup = document.getElementById('manualCityGroup');
    
    if (citySelect) {
        citySelect.addEventListener('change', () => {
            if (citySelect.value === 'OTRO') {
                manualCityGroup.style.display = 'block';
                document.getElementById('manualCity').required = true;
                document.getElementById('manualCity').focus();
            } else {
                manualCityGroup.style.display = 'none';
                document.getElementById('manualCity').required = false;
            }
        });
    }
});

// ==================== MERCADO PAGO CONFIGURATION ====================
const MP_PUBLIC_KEY = 'APP_USR-c4eb2276-e656-4cc8-ad42-3135168127fe';
const mp = new MercadoPago(MP_PUBLIC_KEY, { locale: 'es-CO' });
let selectorsSetup = false;


document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 DOM Loaded - V3 Engine Ready');
    loadCheckoutCart();
    setupPaymentSelectors();
    setupCheckoutForm();
    setupLocationSelectors();
});

function setupLocationSelectors() {
    const deptSelect = document.getElementById('department');
    const citySelect = document.getElementById('city');

    if (deptSelect && citySelect) {
        deptSelect.addEventListener('change', () => {
            const dept = deptSelect.value;
            const cities = colombiaCities[dept] || [];

            // Reset and enable
            citySelect.innerHTML = '<option value="" disabled selected>Ciudad / Municipio</option>';
            citySelect.disabled = false;

            cities.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                citySelect.appendChild(opt);
            });

            // If only one city (like Bogota), select it automatically
            if (cities.length === 1) {
                citySelect.value = cities[0];
            }
        });
    }
}

function loadCheckoutCart() {
    const savedCart = localStorage.getItem('tm_cart');
    if (savedCart) {
        checkoutCart = JSON.parse(savedCart);
        renderCheckoutSummary();
    } else {
        window.location.href = 'collections.html';
    }
}

function renderCheckoutSummary() {
    const listContainer = document.getElementById('checkoutItemsList');
    const subtotalEl = document.getElementById('summarySubtotal');
    const shippingEl = document.getElementById('summaryShipping');
    const totalEl = document.getElementById('summaryTotal');
    if (!listContainer) return;

    let subtotal = 0;
    listContainer.innerHTML = checkoutCart.map(item => {
        let priceValue = 0;
        if (typeof item.price === 'number') {
            priceValue = item.price;
        } else {
            priceValue = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        }
        const itemTotal = priceValue * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="checkout-item-row">
                <div class="item-img-wrapper">
                    <img src="${item.image}" alt="${item.name}">
                    <span class="item-qty-badge">${item.quantity}</span>
                </div>
                <div class="item-info-row">
                    <h4>${item.name}</h4>
                    ${item.size ? `<span class="item-meta">Talla: ${item.size}</span>` : ''}
                </div>
                <div class="item-price-final">
                    $${itemTotal.toLocaleString('es-CO')}
                </div>
            </div>
        `;
    }).join('');

    // Dynamic Shipping
    const currentShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
    const total = subtotal + currentShipping;

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toLocaleString('es-CO')}`;
    
    if (shippingEl) {
        if (currentShipping === 0) {
            shippingEl.innerHTML = '<span style="color: #2ecc71; font-weight: bold;">GRATIS</span>';
        } else {
            shippingEl.textContent = `$${currentShipping.toLocaleString('es-CO')}`;
        }
    }
    
    if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-CO')}`;
}

function getShippingCost(subtotal) {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
}

function setupPaymentSelectors() {
    if (selectorsSetup) return;
    selectorsSetup = true;

    const cards = document.querySelectorAll('.payment-method-card');
    const mainSubmitBtn = document.querySelector('.btn-checkout-final');

    cards.forEach(card => {
        card.addEventListener('click', async () => {
            const method = card.dataset.method;
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Ensure submit button is always visible
            if (mainSubmitBtn) mainSubmitBtn.style.display = 'block';

            // Toggle visibility of Payment Brick container (now always hidden)
            const mpView = document.getElementById('premiumMPView');
            if (mpView) {
                mpView.style.display = 'none';
            }
        });
    });
}

function setupCheckoutForm() {
    const form = document.getElementById('mainCheckoutForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectedMethod = document.querySelector('.payment-method-card.active')?.dataset.method;
            if (!selectedMethod) {
                alert('Por favor selecciona un método de pago.');
                return;
            }

            const customerData = {
                email: document.getElementById('email').value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                dni: document.getElementById('dni').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                department: document.getElementById('department').value,
                phone: document.getElementById('phone').value
            };

            if (selectedMethod === 'addi') {
                handleAddiCheckout(customerData);
            } else if (selectedMethod === 'mercadopago') {
                handleMercadoPagoCheckout(customerData);
            } else if (selectedMethod === 'whatsapp') {
                handleWhatsAppFallback(customerData);
            } else {
                alert('Método de pago en mantenimiento.');
            }
        });
    }
}

async function handleAddiCheckout(customer) {
    const btn = document.querySelector('.btn-checkout-final');
    const originalText = btn.textContent;
    btn.textContent = 'Procesando con Addi...';
    btn.disabled = true;

    console.log('🚀 [V3] Iniciando checkout con Addi...');

    try {
        const cleanStr = (str) => {
            if (!str) return "";
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
        };

        const cleanPhone = customer.phone.replace(/\D/g, '');
        const finalPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

        // Calcular total real
        const subtotal = checkoutCart.reduce((sum, item) => sum + (parseInt(item.price.replace(/[^0-9]/g, '')) * item.quantity), 0);
        const currentShipping = getShippingCost(subtotal);
        const totalAmount = Math.round(subtotal + currentShipping);

        // Mapear items reales para Addi
        const addiItems = checkoutCart.map(item => ({
            sku: String(item.id || "REF-001"),
            name: cleanStr(item.name).slice(0, 100),
            quantity: parseInt(item.quantity) || 1,
            unitPrice: parseInt(item.price.replace(/[^0-9]/g, '')),
            size: item.size || null,
            color: item.color || null,
            category: "Fashion"
        }));

        const payload = {
            orderData: {
                testMode: false,
                allySlug: "tennisymasco-ecommerce",
                orderId: "TM-" + Date.now(),
                totalAmount: totalAmount,
                currency: "COP",
                shippingAddress: {
                    line1: cleanStr(customer.address) || "CALLE 123",
                    city: cleanStr(customer.city) || "BOGOTA",
                    administrativeDivision: cleanStr(customer.department) || cleanStr(customer.city),
                    country: "CO"
                },
                client: {
                    idType: "CC",
                    idNumber: String(customer.dni).trim(),
                    firstName: cleanStr(customer.firstName),
                    lastName: cleanStr(customer.lastName),
                    email: String(customer.email).trim().toLowerCase(),
                    cellphone: finalPhone
                },
                redirectionUrls: {
                    success: window.location.origin + "/success.html",
                    failure: window.location.origin + "/checkout.html",
                    cancel: window.location.origin + "/checkout.html",
                    origin: window.location.origin
                },
                items: addiItems
            }
        };

        const response = await fetch('https://shbtmkeyarqppasdpzxv.supabase.co/functions/v1/addi-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('📦 [V3] Respuesta del servidor:', result);

        // Addi V3 puede retornar redirectionUrl o checkoutUrl
        const redirectUrl = result.redirectionUrl || result.checkoutUrl;

        if (redirectUrl) {
            console.log('✅ Redirigiendo a Addi:', redirectUrl);
            window.location.href = redirectUrl;
        } else {
            console.error('❌ [V3] Error Crítico de Addi:', result);

            // Log full details for debugging
            if (result.details) {
                console.log('🔍 Detalles del error Addi:', JSON.stringify(result.details, null, 2));
            }
            if (result.called_url) {
                console.log('🔗 URL llamada:', result.called_url);
            }

            const errorMsg = result.details?.message || result.error || "Error de respuesta del servidor";
            alert(`Error de Addi (Status ${result.status}): ${errorMsg}\n\nPor favor, revisa la consola del navegador para ver los detalles técnicos y envíame una captura.`);

            handleWhatsAppFallback(customer);
        }
    } catch (err) {
        console.error('❌ [V3] Error General:', err);
        alert('Hubo un inconveniente técnico con Addi. Te redirigiremos a WhatsApp para finalizar tu compra.');
        handleWhatsAppFallback(customer);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}


// ==================== MERCADO PAGO INTEGRATION ====================

// ==================== MERCADO PAGO REDIRECTION FLOW ====================

async function handleMercadoPagoCheckout(customer) {
    const btn = document.querySelector('.btn-checkout-final');
    const originalText = btn.textContent;
    btn.textContent = 'Redirigiendo a Mercado Pago...';
    btn.disabled = true;

    console.log('🚀 Iniciando checkout con Mercado Pago (Redirect)...');

    try {
        const getAbsoluteUrl = (url) => {
            if (!url) return "";
            if (url.startsWith('http')) return url;
            return window.location.origin + (url.startsWith('/') ? '' : '/') + url;
        };

        const items = checkoutCart.map(item => ({
            id: item.id,
            name: item.name,
            price: parseInt(item.price.replace(/[^0-9]/g, '')),
            quantity: item.quantity,
            size: item.size || null,
            color: item.color || null,
            image: getAbsoluteUrl(item.image)
        }));

        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const currentShipping = getShippingCost(subtotal);

        items.push({
            name: "Costo de Envío",
            price: currentShipping,
            quantity: 1
        });

        const payload = {
            orderId: "TM-" + Date.now(),
            customer: customer,
            items: items
        };

        const response = await fetch('https://shbtmkeyarqppasdpzxv.supabase.co/functions/v1/mercadopago-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('🎫 Respuesta de MP:', result);

        if (result.init_point) {
            console.log('✅ Redirigiendo a Pasarela Oficial...');
            window.location.href = result.init_point;
        } else {
            throw new Error("No se obtuvo el punto de inicio (init_point)");
        }
    } catch (error) {
        console.error('❌ Error en Mercado Pago Checkout:', error);
        alert('Hubo un problema al conectar con Mercado Pago. Intentando por WhatsApp...');
        handleWhatsAppFallback(customer);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}


async function handleWhatsAppFallback(customer) {
    const WHATSAPP_NUMBER = '573204961453';
    let message = `Hola! Realizo mi pedido por la web:\n\n`;
    message += `👤 *Cliente:* ${customer.firstName || "Cliente"} ${customer.lastName || ""}\n`;
    message += `📍 *Ciudad:* ${customer.city || "No especificada"}, ${customer.department || "No especificado"}\n`;
    message += `🏠 *Dirección:* ${customer.address || "No especificada"}\n\n`;

    let total = 0;
    const orderItems = checkoutCart.map(item => {
        const itemPrice = parseInt(item.price.replace(/[^0-9]/g, ''));
        total += itemPrice * item.quantity;
        message += `📦 *${item.quantity}x ${item.name}* ${item.size ? `(Talla: ${item.size})` : ''} ${item.color ? `(Color: ${item.color})` : ''}\n`;
        return {
            name: item.name,
            quantity: item.quantity,
            price: itemPrice,
            size: item.size || null,
            color: item.color || null
        };
    });

    const currentShipping = getShippingCost(total);
    const finalTotal = total + currentShipping;
    message += `\n💰 *TOTAL: $${finalTotal.toLocaleString('es-CO')}*`;

    // (NUEVO) Registrar en la base de datos de pedidos
    try {
        if (window.supabaseClient) {
            await window.supabaseClient.from('orders').insert([{
                customer_info: customer,
                items: orderItems,
                total: finalTotal,
                payment_method: 'whatsapp',
                status: 'pending'
            }]);
            console.log('✅ Pedido por WhatsApp registrado');
        }
    } catch (e) {
        console.error('Error registrando pedido WhatsApp:', e);
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}
