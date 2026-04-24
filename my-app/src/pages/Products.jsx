import { useEffect, useState } from "react";
import API from "../api";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { useDatabaseTranslation } from "../hooks/useDatabaseTranslation";
import { useCart } from "../context/CartContext";

function Products() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { useTranslatedProducts } = useDatabaseTranslation();
    const { selectedFarmer, setSelectedFarmer, clearSelectedFarmer } = useCart();
    const [products, setProducts] = useState([]);
    const translatedProducts = useTranslatedProducts(products);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [farmers, setFarmers] = useState([]);
    const [showFarmerSelector, setShowFarmerSelector] = useState(false);
    const [buyerDistrict, setBuyerDistrict] = useState('');
    const [buyerSector, setBuyerSector] = useState('');
    const [buyerProvince, setBuyerProvince] = useState('');
    const [buyerCell, setBuyerCell] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [locationSet, setLocationSet] = useState(false);
    const [allProducts, setAllProducts] = useState([]); // Store all products for search
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [inStockOnly, setInStockOnly] = useState(false);

    // Rwanda Districts and Sectors data
    const rwandaDistricts = {
        "Bugesera": ["Gashora", "Juru", "Kamabuye", "Mareba", "Mayange", "Musenyi", "Mwogo", "Ngeruka", "Nyamata", "Nyarugenge", "Rilima", "Ruhuha", "Rweru", "Shyara"],
        "Gatsibo": ["Gasange", "Gatsibo", "Gitoki", "Kabarore", "Kageyo", "Kiramuruzi", "Kiziguro", "Muhura", "Murambi", "Ngarama", "Nyagihanga", "Remera", "Rugarama", "Rwimbogo"],
        "Kayonza": ["Gahini", "Kabare", "Kabarondo", "Mukarange", "Murama", "Murundi", "Mwiri", "Ndego", "Nyamirama", "Rukara", "Ruramira", "Rwinkwavu"],
        "Kirehe": ["Gahara", "Gatore", "Kigarama", "Kigina", "Kirehe", "Mahama", "Mpanga", "Musaza", "Mushikiri", "Nasho", "Nyamugari", "Nyarubuye"],
        "Ngoma": ["Gashanda", "Jarama", "Karembo", "Kibungo", "Mugesera", "Murama", "Mutenderi", "Remera", "Rukira", "Rukumberi", "Rurenge", "Sake", "Zaza"],
        "Nyagatare": ["Gatunda", "Karama", "Karangazi", "Katabagemu", "Kiyombe", "Matimba", "Mimuli", "Mukama", "Musheri", "Nyagatare", "Rukomo", "Rwempasha", "Rwimiyaga", "Tabagwe"],
        "Rwamagana": ["Fumbwe", "Gahengeri", "Gishari", "Karenge", "Kigabiro", "Muhazi", "Munyaga", "Munyiginya", "Musha", "Muyumbu", "Mwurire", "Nyakariro", "Nzige", "Rubona"],
        "Burera": ["Bungwe", "Butaro", "Cyanika", "Cyeru", "Gahunga", "Gatebe", "Gitovu", "Kagogo", "Kinoni", "Kinyababa", "Kivuye", "Nemba", "Rugarama", "Ruhunde", "Rusarabuye", "Rwerere"],
        "Gakenke": ["Busengo", "Coko", "Cyabingo", "Gakenke", "Gashenyi", "Mugunga", "Janja", "Kamubuga", "Karambo", "Kivuruga", "Mataba", "Minazi", "Muhondo", "Muzo", "Nemba", "Ruli", "Rusasa", "Rushashi"],
        "Gicumbi": ["Bukure", "Bwisige", "Byumba", "Cyumba", "Giti", "Kageyo", "Kaniga", "Manyagiro", "Miyove", "Mukarange", "Muko", "Mutete", "Muyumbu", "Ribeye", "Rukomo", "Rushaki", "Rutare", "Ruvune", "Rwamiko", "Shangasha"],
        "Musanze": ["Busogo", "Cyuve", "Gacaca", "Gashaki", "Jomba", "Jenda", "Kinigi", "Muhoza", "Muko", "Mpinga", "Muhoza", "Nyange", "Remera", "Rwaza", "Shingiro"],
        "Rulindo": ["Base", "Burega", "Bushoki", "Buyoga", "Cyinzuzi", "Cyungo", "Kinihira", "Kisaro", "Masoro", "Mbogo", "Murambi", "Ngoma", "Ntarabana", "Rukozo", "Rusiga", "Shyorongi", "Tumba"],
        "Gisagara": ["Gikonko", "Gishubi", "Kansi", "Kibilizi", "Kigembe", "Mamba", "Muganza", "Mukindo", "Musha", "Ndora", "Nyanza", "Save"],
        "Huye": ["Gishamvu", "Karama", "Kigoma", "Kinazi", "Maraba", "Mbazi", "Mukura", "Ngoma", "Ruhashya", "Rusatira", "Rwaniro", "Simbi", "Tumba"],
        "Kamonyi": ["Gacurabwenge", "Karama", "Kayenzi", "Kayumbu", "Mugina", "Musambira", "Ngamba", "Rukoma", "Runda", "Ruyenzi", "Satu"],
        "Muhanga": ["Cyeza", "Kabacuzi", "Kibangu", "Kiyumba", "Muhanga", "Mushishiro", "Nyabinoni", "Nyamabuye", "Nyarusange", "Shyogwe"],
        "Nyamagabe": ["Buruhukiro", "Cyanika", "Gasaka", "Gatare", "Kaduha", "Kamegeli", "Kibirizi", "Kigeme", "Mugano", "Musange", "Musebeya", "Mushubi", "Nkomane", "Kitabi", "Rwabicuma", "Tare"],
        "Nyanza": ["Busasamana", "Busoro", "Cyabakamyi", "Kigoma", "Mukingo", "Ntyazo", "Nyagisozi", "Rwabicuma"],
        "Nyaruguru": ["Busanze", "Cyahinda", "Kibeho", "Mata", "Munini", "Ngera", "Ngoma", "Nyabimata", "Nyagisozi", "Ruheru", "Ruramba", "Rusenge"],
        "Ruhango": ["Bweramana", "Byimana", "Kabagari", "Kinazi", "Kinihira", "Mbuye", "Mwendo", "Ntongwe", "Ruhango"],
        "Kicukiro": ["Gahanga", "Gatenga", "Gikondo", "Gisagara", "Kagarama", "Kicukiro", "Kigarama", "Masaka", "Niboye", "Nyarugunga"],
        "Gasabo": ["Bumbogo", "Gatsata", "Gikomero", "Gisozi", "Jabana", "Jali", "Kacyiru", "Kimihurura", "Kimironko", "Kinyinya", "Ndera", "Nduba", "Remera", "Rusororo", "Rutunga"],
        "Nyarugenge": ["Gitega", "Kanyinya", "Kigali", "Kimisagara", "Mageragere", "Muhima", "Nyakabanda", "Nyamirambo", "Nyarugenge", "Rwezamenyo"],
        "Karongi": ["Bwishyura", "Gishyita", "Gishari", "Mubuga", "Mugonero", "Murambi", "Murundi", "Mutuntu", "Rubengera", "Ruganda", "Twumba"],
        "Ngororero": ["Bwira", "Hindiro", "Kabaya", "Kageyo", "Kavumu", "Matyazo", "Muhanda", "Muhororo", "Ndaro", "Ngororero", "Nyange", "Sovu"],
        "Nyabihu": ["Jenda", "Jomba", "Kaberuka", "Kageyo", "Kintobo", "Mukamira", "Murora", "Rambura", "Rugera", "Rurembo", "Shyira"],
        "Nyamasheke": ["Bushekeri", "Bushenge", "Cyato", "Gihombo", "Kagano", "Kanjongo", "Karambi", "Karengera", "Kirimbi", "Macuba", "Nyabitekeri", "Mahembe", "Nyamasheke", "Rangiro"],
        "Rubavu": ["Bugeshi", "Busasamana", "Cyanzarwe", "Gisenyi", "Kanama", "Kanzenze", "Mudende", "Nyakiliba", "Nyamyumba", "Nyundo", "Rubavu", "Rugerero"],
        "Rusizi": ["Bugarama", "Butare", "Bweyeye", "Gikundamvura", "Gashonga", "Giheke", "Gihundwe", "Gitambi", "Kamembe", "Muganza", "Mururu", "Nkanka", "Nkombo", "Nkungu", "Nyakabuye", "Nyakarenzo", "Nzahaha", "Rwimbogo"],
        "Rutsiro": ["Boneza", "Gihango", "Kigeyo", "Manihira", "Mukura", "Murundi", "Musasa", "Mushonyi", "Mushubati", "Nyabirasi", "Ruhango", "Rusebeya"]
    };

    // Check authentication on component mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
            navigate('/login');
            return;
        }

        // Check if farmer was passed from BuyerDashboard
        if (location.state?.selectedFarmer) {
            setSelectedFarmer(location.state.selectedFarmer);
        }
        
        // Check if location (district, sector) was passed from BuyerDashboard
        const passedDistrict = location.state?.district;
        const passedSector = location.state?.sector;

        // Use passed location if available, otherwise use state from inputs
        if (passedDistrict && !buyerDistrict) {
            setBuyerDistrict(passedDistrict);
        }
        if (passedSector && !buyerSector) {
            setBuyerSector(passedSector);
        }

        // Only fetch products if authenticated
        setLoading(true);

        // Fetch farmers first to filter by location if provided
        API.get("/buyer/farmers")
            .then(res => {
                let filteredFarmers = res.data || [];
                console.log('All farmers from API:', filteredFarmers);
                console.log('Sample farmer structure:', filteredFarmers[0]);

                // Filter farmers by location if district/sector is provided
                const currentDistrict = buyerDistrict || passedDistrict;
                const currentSector = buyerSector || passedSector;
                const currentProvince = buyerProvince;
                const currentCell = buyerCell;
                console.log('Current location:', { province: currentProvince, district: currentDistrict, sector: currentSector, cell: currentCell });

                if (currentDistrict || currentSector || currentProvince || currentCell) {
                    filteredFarmers = filteredFarmers.filter(farmer => {
                        const farmerLocation = farmer.location || '';
                        const farmerProvince = farmer.province || '';
                        const farmerDistrict = farmer.farmer_district || farmer.district || '';
                        const farmerSector = farmer.farmer_sector || farmer.sector || '';
                        const farmerCell = farmer.cell || '';

                        // STRICT matching - farmer must be in the selected location
                        let matches = true;

                        // If province is selected, farmer must be in that province
                        if (currentProvince) {
                            matches = matches && farmerProvince.toLowerCase() === currentProvince.toLowerCase();
                        }

                        // If district is selected, farmer must be in that district
                        if (currentDistrict) {
                            const districtMatches = farmerDistrict.toLowerCase() === currentDistrict.toLowerCase() ||
                                                   farmerLocation.toLowerCase().includes(currentDistrict.toLowerCase());
                            matches = matches && districtMatches;
                        }

                        // If sector is selected, farmer must be in that sector
                        if (currentSector) {
                            const sectorMatches = farmerSector.toLowerCase() === currentSector.toLowerCase() ||
                                                 farmerLocation.toLowerCase().includes(currentSector.toLowerCase());
                            matches = matches && sectorMatches;
                        }

                        // If cell is selected, farmer must be in that cell
                        if (currentCell) {
                            matches = matches && farmerCell.toLowerCase() === currentCell.toLowerCase();
                        }

                        console.log('Farmer:', farmer.full_name, 'Location:', farmerLocation, 'Province:', farmerProvince, 'District:', farmerDistrict, 'Sector:', farmerSector, 'Cell:', farmerCell, 'Matches:', matches);

                        return matches;
                    });

                    console.log('Filtered farmers by strict location:', filteredFarmers);
                }
                
                setFarmers(filteredFarmers);

                // Fetch products - if location filtering is active, fetch products from filtered farmers ONLY
                if (currentDistrict || currentSector) {
                    // Get products from filtered farmers only (strict filtering)
                    const farmerIds = filteredFarmers.map(f => f.farmer_id || f.user_id).filter(Boolean);

                    if (farmerIds.length > 0) {
                        // Fetch products for these farmers
                        const productPromises = farmerIds.map(farmerId =>
                            API.get(`/products?farmer_id=${farmerId}`)
                        );

                        Promise.all(productPromises)
                            .then(responses => {
                                const allProducts = responses.flatMap(res => res.data || []);
                                console.log('Products from farmers in location:', allProducts);
                                setAllProducts(allProducts);
                                setProducts(allProducts);
                                setLoading(false);
                            })
                            .catch(err => {
                                console.error("Filtered products error:", err);
                                // Don't fallback to all products - show empty
                                setAllProducts([]);
                                setProducts([]);
                                setLoading(false);
                            });
                    } else {
                        // No farmers found in the area - show empty products (strict filtering)
                        console.log('No farmers in selected location - showing empty products');
                        setAllProducts([]);
                        setProducts([]);
                        setLoading(false);
                    }
                } else {
                    // No location filter, fetch all products
                    API.get("/products")
                        .then(res => {
                            console.log('All products fetched:', res.data);
                            const allProducts = res.data || [];
                            setAllProducts(allProducts);
                            setProducts(allProducts);
                            setLoading(false);
                        })
                        .catch(err => {
                            console.error("Fetch error:", err);
                            setError(t('failedFetchProducts'));
                            setLoading(false);
                        });
                }
            })
            .catch(err => {
                console.error("Farmers fetch error:", err);
                // Fallback to all products
                API.get("/products")
                    .then(res => {
                        setProducts(res.data || []);
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error("Fetch error:", err);
                        setError(t('failedFetchProducts'));
                        setLoading(false);
                    });
            });
    }, [navigate, location.state]);

    // Filter products based on search query and filters
    useEffect(() => {
        let filtered = [...allProducts];

        // Apply search filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(product => {
                return (
                    product.product_name?.toLowerCase().includes(query) ||
                    product.category?.toLowerCase().includes(query) ||
                    product.full_name?.toLowerCase().includes(query) ||
                    product.description?.toLowerCase().includes(query)
                );
            });
        }

        // Apply category filter
        if (selectedCategories.length > 0) {
            filtered = filtered.filter(product =>
                selectedCategories.includes(product.category)
            );
        }

        // Apply price range filter
        if (minPrice !== '') {
            filtered = filtered.filter(product => product.price >= parseFloat(minPrice));
        }
        if (maxPrice !== '') {
            filtered = filtered.filter(product => product.price <= parseFloat(maxPrice));
        }

        // Apply in-stock filter
        if (inStockOnly) {
            filtered = filtered.filter(product => product.quantity > 0);
        }

        setProducts(filtered);
    }, [searchQuery, selectedCategories, minPrice, maxPrice, inStockOnly, allProducts]);

    // Handler functions
    const handleUpdateLocation = async () => {
        console.log('handleUpdateLocation called with province:', buyerProvince, 'district:', buyerDistrict, 'sector:', buyerSector, 'cell:', buyerCell);

        if (!buyerDistrict && !buyerSector && !buyerProvince && !buyerCell) {
            alert('Please enter at least one location field (province, district, sector, or cell)');
            return;
        }

        setLocationSet(true);
        setLoading(true);

        // Fetch farmers and filter by location with STRICT matching
        API.get("/buyer/farmers")
            .then(res => {
                let allFarmers = res.data || [];
                console.log('All farmers from API:', allFarmers);

                // STRICT matching - only farmers in the selected location
                let filteredFarmers = allFarmers.filter(farmer => {
                    const farmerLocation = farmer.location || '';
                    const farmerProvince = farmer.province || '';
                    const farmerDistrict = farmer.farmer_district || farmer.district || '';
                    const farmerSector = farmer.farmer_sector || farmer.sector || '';
                    const farmerCell = farmer.cell || '';

                    let matches = true;

                    // If province is selected, farmer must be in that province
                    if (buyerProvince) {
                        matches = matches && farmerProvince.toLowerCase() === buyerProvince.toLowerCase();
                    }

                    // If district is selected, farmer must be in that district
                    if (buyerDistrict) {
                        const districtMatches = farmerDistrict.toLowerCase() === buyerDistrict.toLowerCase() ||
                                               farmerLocation.toLowerCase().includes(buyerDistrict.toLowerCase());
                        matches = matches && districtMatches;
                    }

                    // If sector is selected, farmer must be in that sector
                    if (buyerSector) {
                        const sectorMatches = farmerSector.toLowerCase() === buyerSector.toLowerCase() ||
                                             farmerLocation.toLowerCase().includes(buyerSector.toLowerCase());
                        matches = matches && sectorMatches;
                    }

                    // If cell is selected, farmer must be in that cell
                    if (buyerCell) {
                        matches = matches && farmerCell.toLowerCase() === buyerCell.toLowerCase();
                    }

                    console.log('Farmer:', farmer.full_name, 'Matches:', matches);
                    return matches;
                });

                console.log('Filtered farmers count (strict):', filteredFarmers.length);
                setFarmers(filteredFarmers);

                // Show appropriate message
                if (filteredFarmers.length > 0) {
                    alert(`Found ${filteredFarmers.length} farmer${filteredFarmers.length !== 1 ? 's' : ''} in your selected location`);
                    setShowFarmerSelector(true);
                } else {
                    alert(`No farmers found in ${buyerDistrict}${buyerSector ? `, ${buyerSector}` : ''}. Please try a different location or browse all products.`);
                }

                // Fetch products from filtered farmers ONLY (strict filtering)
                if (filteredFarmers.length > 0) {
                    const farmerIds = filteredFarmers.map(f => f.farmer_id || f.user_id).filter(Boolean);
                    console.log('Farmer IDs for product fetch:', farmerIds);
                    const productPromises = farmerIds.map(farmerId =>
                        API.get(`/products?farmer_id=${farmerId}`)
                    );

                    Promise.all(productPromises)
                        .then(responses => {
                            const allProducts = responses.flatMap(res => res.data || []);
                            console.log('Products from farmers in location:', allProducts);
                            setAllProducts(allProducts);
                            setProducts(allProducts);
                            setLoading(false);
                        })
                        .catch(err => {
                            console.error("Filtered products error:", err);
                            setAllProducts([]);
                            setProducts([]);
                            setLoading(false);
                        });
                } else {
                    // No farmers found - show empty products (don't fall back to all)
                    setAllProducts([]);
                    setProducts([]);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error("Farmers fetch error:", err);
                setLoading(false);
            });
    };

    const handleFarmerSelection = (farmer) => {
        console.log('Selected farmer object:', farmer);
        setSelectedFarmer(farmer);
        setShowFarmerSelector(false);
        // Filter products by selected farmer - use farmer_id or user_id as fallback
        const farmerId = farmer.farmer_id || farmer.user_id;
        console.log('Using farmer_id:', farmerId, 'for farmer:', farmer.farmer_name || farmer.full_name);

        if (!farmerId) {
            console.error('No farmer_id found in farmer object:', farmer);
            return;
        }

        API.get(`/products?farmer_id=${farmerId}`)
            .then(res => {
                console.log('Filtered products for farmer:', farmer.farmer_name || farmer.full_name, res.data);
                setProducts(res.data || []);
            })
            .catch(err => {
                console.error("Filtered products error:", err);
            });
    };

    const clearFarmerSelection = () => {
        clearSelectedFarmer();
        // Show all products again
        API.get("/products")
            .then(res => {
                setProducts(res.data || []);
            })
            .catch(err => {
                console.error("All products error:", err);
            });
    };

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-16 w-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                    <p className="text-gray-700 font-semibold text-lg">{t('loadingProducts')}</p>
                    <p className="text-gray-600 text-sm mt-2">{t('connectingFarmers')}</p>
                </div>
            </div>
        );
    }

    // Error screen
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
                    <div className="text-red-500 text-6xl mb-4">🌾</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Breadcrumb */}
                        <div className="flex items-center text-sm text-gray-600">
                            <Link to="/" className="hover:text-emerald-600">Home</Link>
                            <span className="mx-2">/</span>
                            <span className="text-gray-900 font-medium">Products</span>
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Results Count */}
                        <div className="text-sm text-gray-600">
                            {products.length} product{products.length !== 1 ? 's' : ''}
                            {(buyerDistrict || buyerSector || location.state?.district || location.state?.sector) && farmers.length > 0 && (
                                <span className="text-emerald-600"> from {farmers.length} farmer{farmers.length !== 1 ? 's' : ''} near you</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-4">Filters</h3>

                            {/* Location Filter */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-3">Your Location</h4>
                                <div className="space-y-3">
                                    {/* Province Input */}
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Province</label>
                                        <input
                                            type="text"
                                            placeholder="Enter province"
                                            value={buyerProvince}
                                            onChange={(e) => setBuyerProvince(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* District Dropdown */}
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">District</label>
                                        <select
                                            value={buyerDistrict}
                                            onChange={(e) => {
                                                setBuyerDistrict(e.target.value);
                                                setBuyerSector(''); // Reset sector when district changes
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            <option value="">Select District</option>
                                            {Object.keys(rwandaDistricts).sort().map((dist) => (
                                                <option key={dist} value={dist}>
                                                    {dist}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Sector Dropdown */}
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Sector</label>
                                        <select
                                            value={buyerSector}
                                            onChange={(e) => setBuyerSector(e.target.value)}
                                            disabled={!buyerDistrict}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${!buyerDistrict ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                        >
                                            <option value="">
                                                {!buyerDistrict ? 'Select District First' : 'Select Sector'}
                                            </option>
                                            {buyerDistrict && rwandaDistricts[buyerDistrict]?.map((sec) => (
                                                <option key={sec} value={sec}>
                                                    {sec}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Cell Input */}
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Cell (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="Enter cell"
                                            value={buyerCell}
                                            onChange={(e) => setBuyerCell(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>

                                    <button
                                        onClick={handleUpdateLocation}
                                        className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm mt-2"
                                    >
                                        Find Nearby Products
                                    </button>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
                                <div className="space-y-2">
                                    {[...new Set(allProducts.map(p => p.category))].slice(0, 8).map((category) => (
                                        <label key={category} className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                                checked={selectedCategories.includes(category)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedCategories([...selectedCategories, category]);
                                                    } else {
                                                        setSelectedCategories(selectedCategories.filter(c => c !== category));
                                                    }
                                                }}
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{category}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                    <span className="text-gray-500">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-3">Availability</h4>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                        checked={inStockOnly}
                                        onChange={(e) => setInStockOnly(e.target.checked)}
                                    />
                                    <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                                </label>
                            </div>

                            {/* Selected Farmer */}
                            {selectedFarmer && (
                                <div className="mb-6 p-3 bg-emerald-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-900">Selected Farmer</span>
                                        <button onClick={clearFarmerSelection} className="text-xs text-red-600 hover:text-red-700">Clear</button>
                                    </div>
                                    <p className="text-sm text-gray-700">{selectedFarmer.full_name}</p>
                                    <p className="text-xs text-gray-500">{selectedFarmer.location || 'Location not specified'}</p>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    // Filters are applied automatically via useEffect, this button can be used to reset or confirm
                                    console.log('Filters applied:', { selectedCategories, minPrice, maxPrice, inStockOnly });
                                }}
                                className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {/* Location-based Shopping Banner */}
                        {(buyerDistrict || buyerSector || location.state?.district || location.state?.sector) && (
                            <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {farmers.length > 0
                                                    ? `Showing products from ${buyerDistrict || location.state?.district}${buyerSector || location.state?.sector ? `, ${buyerSector || location.state?.sector}` : ''}`
                                                    : `No farmers in ${buyerDistrict || location.state?.district}${buyerSector || location.state?.sector ? `, ${buyerSector || location.state?.sector}` : ''}`
                                                }
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {farmers.length > 0
                                                    ? `Only showing products from ${farmers.length} farmer${farmers.length !== 1 ? 's' : ''} located in your selected area`
                                                    : 'Try selecting a different location or browse all products'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                // Clear location filters and show all products
                                                setBuyerDistrict('');
                                                setBuyerSector('');
                                                setBuyerProvince('');
                                                setBuyerCell('');
                                                setLocationSet(false);
                                                setFarmers([]);
                                                // Fetch all products
                                                API.get("/products")
                                                    .then(res => {
                                                        const allProds = res.data || [];
                                                        setAllProducts(allProds);
                                                        setProducts(allProds);
                                                    });
                                            }}
                                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
                                        >
                                            Browse All
                                        </button>
                                        <button
                                            onClick={() => navigate('/buyer-dashboard')}
                                            className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                        >
                                            Change Location
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Location Set Banner */}
                        {!buyerDistrict && !buyerSector && !location.state?.district && !location.state?.sector && (
                            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Set Your Location</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Find products from farmers near you for fresher produce and faster delivery
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/buyer-dashboard')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Set Location
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Nearby Farmers Section */}
                        {farmers.length > 0 && !selectedFarmer && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                    Farmers Near You
                                </h3>
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {farmers.slice(0, 5).map((farmer) => (
                                        <button
                                            key={farmer.farmer_id || farmer.user_id}
                                            onClick={() => handleFarmerSelection(farmer)}
                                            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                                        >
                                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-emerald-600">
                                                    {(farmer.full_name || farmer.farmer_name || 'F').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                                                    {farmer.full_name || farmer.farmer_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {farmer.farmer_district || farmer.district || 'Location N/A'}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Selected Farmer Banner */}
                        {selectedFarmer && (
                            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <span className="font-medium text-emerald-600">
                                                {(selectedFarmer.full_name || selectedFarmer.farmer_name || 'F').charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                Products from {selectedFarmer.full_name || selectedFarmer.farmer_name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {selectedFarmer.location || selectedFarmer.farmer_district || selectedFarmer.district || 'Location not specified'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={clearFarmerSelection}
                                        className="px-3 py-1.5 text-sm text-emerald-700 hover:text-emerald-800 hover:bg-white rounded-lg transition-colors"
                                    >
                                        View All Products
                                    </button>
                                </div>
                            </div>
                        )}

                        {products.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                    {(buyerDistrict || buyerSector || location.state?.district || location.state?.sector)
                                        ? `No products available from farmers in ${buyerDistrict || location.state?.district}${buyerSector || location.state?.sector ? `, ${buyerSector || location.state?.sector}` : ''}. Try expanding your search or browse all products.`
                                        : 'Try adjusting your filters or search terms'
                                    }
                                </p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {(buyerDistrict || buyerSector || location.state?.district || location.state?.sector) && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    // Clear location filters and show all products
                                                    setBuyerDistrict('');
                                                    setBuyerSector('');
                                                    setBuyerProvince('');
                                                    setBuyerCell('');
                                                    setLocationSet(false);
                                                    setFarmers([]);
                                                    API.get("/products")
                                                        .then(res => {
                                                            const allProds = res.data || [];
                                                            setAllProducts(allProds);
                                                            setProducts(allProds);
                                                        });
                                                }}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                            >
                                                Browse All Products
                                            </button>
                                            <button
                                                onClick={() => navigate('/buyer-dashboard')}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                            >
                                                Change Location
                                            </button>
                                        </>
                                    )}
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            Clear Search
                                        </button>
                                    )}
                                    {(selectedCategories.length > 0 || minPrice || maxPrice || inStockOnly) && (
                                        <button
                                            onClick={() => {
                                                setSelectedCategories([]);
                                                setMinPrice('');
                                                setMaxPrice('');
                                                setInStockOnly(false);
                                            }}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <Link key={product.product_id} to={`/products/${product.product_id}`} className="group">
                                        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                                            {/* Product Image */}
                                            <div className="relative aspect-square bg-gray-100">
                                                {product.image || product.image_url ? (
                                                    <img
                                                        src={product.image?.startsWith('uploads/') ? `http://localhost:5000/${product.image}` : `http://localhost:5000/uploads/products/${product.image || product.image_url}`}
                                                        alt={product.product_name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-4xl">🌾</span>
                                                    </div>
                                                )}

                                                {/* Badges */}
                                                <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                    {product.quantity <= 0 && (
                                                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                            Out of Stock
                                                        </div>
                                                    )}
                                                    {/* Local Badge - Show for all products when strict location filtering is active */}
                                                    {(buyerDistrict || buyerSector || location.state?.district || location.state?.sector) && (
                                                        <div className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                            </svg>
                                                            Local
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Product Info */}
                                            <div className="p-4">
                                                <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                                                    {product.product_name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mb-2">{product.category}</p>

                                                {/* Farmer Location */}
                                                <div className="flex items-center gap-1 mb-2 text-xs text-gray-500">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="truncate">
                                                        {product.farmer_district || product.district || product.farmer_location || 'Location N/A'}
                                                        {product.farmer_sector || product.sector ? `, ${product.farmer_sector || product.sector}` : ''}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-emerald-600">RWF {product.price}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const token = localStorage.getItem('token');
                                                            if (!token) {
                                                                navigate('/login');
                                                            }
                                                        }}
                                                        className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Products;
