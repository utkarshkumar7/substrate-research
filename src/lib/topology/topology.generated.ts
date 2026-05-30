// AUTO-GENERATED from topology.yaml — do not edit manually.
import type { Topology } from './types';

export const TOPOLOGY: Topology = {
  "metadata": {
    "name": "AI Supply Chain Command Center",
    "description": "Pipeline from silicon to chatbot",
    "version": 2,
    "lastUpdated": "2026-05-20"
  },
  "layers": [
    {
      "id": "raw_materials",
      "name": "Raw Materials",
      "description": "Rare earths, critical minerals, uranium feedstock",
      "order": 0,
      "color": "#8B6F47"
    },
    {
      "id": "energy",
      "name": "Energy Generation",
      "description": "Power for datacenters and devices",
      "order": 1,
      "color": "#E8833A"
    },
    {
      "id": "storage_batteries",
      "name": "Storage & Batteries",
      "description": "Grid and device-level energy storage",
      "order": 1,
      "parallelTo": "energy",
      "color": "#D85A4A"
    },
    {
      "id": "foundries_memory",
      "name": "Foundries & Memory",
      "description": "Chip fabrication and memory manufacturing",
      "order": 2,
      "color": "#4A7FB5"
    },
    {
      "id": "chip_design",
      "name": "Chip Design",
      "description": "CPU/GPU/AI accelerator designers",
      "order": 3,
      "color": "#2A5FA0"
    },
    {
      "id": "quantum",
      "name": "Quantum Compute",
      "description": "Alternative compute paradigm",
      "order": 3,
      "parallelTo": "chip_design",
      "color": "#7B5FB8"
    },
    {
      "id": "photonics",
      "name": "Photonics & Optical",
      "description": "Optical transceivers, modulators, compound-semi substrates for AI datacenter interconnect",
      "order": 3,
      "parallelTo": "chip_design",
      "color": "#0ea5e9"
    },
    {
      "id": "datacenter_infra",
      "name": "Datacenter & Infrastructure",
      "description": "Servers, cooling, power distribution, neoclouds",
      "order": 4,
      "color": "#3FA89E"
    },
    {
      "id": "applications",
      "name": "End Applications",
      "description": "AVs, robotics, space, drones, hyperscalers",
      "order": 5,
      "color": "#4FB85A"
    }
  ],
  "tickers": [
    {
      "symbol": "MP",
      "name": "MP Materials",
      "layer": "raw_materials",
      "subcategory": "rare_earths",
      "notes": "Mountain Pass mine; permanent magnets supply chain"
    },
    {
      "symbol": "USAR",
      "name": "USA Rare Earth",
      "layer": "raw_materials",
      "subcategory": "rare_earths"
    },
    {
      "symbol": "CRML",
      "name": "Critical Metals",
      "layer": "raw_materials",
      "subcategory": "critical_minerals"
    },
    {
      "symbol": "TMC",
      "name": "The Metals Company",
      "layer": "raw_materials",
      "subcategory": "seabed_minerals",
      "notes": "Ni/Co/Cu/Mn polymetallic nodules"
    },
    {
      "symbol": "TMQ",
      "name": "Trilogy Metals",
      "layer": "raw_materials",
      "subcategory": "critical_minerals"
    },
    {
      "symbol": "UAMY",
      "name": "United States Antimony",
      "layer": "raw_materials",
      "subcategory": "antimony",
      "notes": "Antimony is used in semiconductor doping"
    },
    {
      "symbol": "LAC",
      "name": "Lithium Americas",
      "layer": "raw_materials",
      "subcategory": "lithium"
    },
    {
      "symbol": "CCJ",
      "name": "Cameco",
      "layer": "raw_materials",
      "subcategory": "uranium"
    },
    {
      "symbol": "LEU",
      "name": "Centrus Energy",
      "layer": "raw_materials",
      "subcategory": "uranium_enrichment",
      "notes": "HALEU enrichment for advanced reactors"
    },
    {
      "symbol": "UUUU",
      "name": "Energy Fuels",
      "layer": "raw_materials",
      "subcategory": "uranium_rare_earth",
      "notes": "Both uranium and rare earth processing"
    },
    {
      "symbol": "BE",
      "name": "Bloom Energy",
      "layer": "energy",
      "subcategory": "fuel_cells"
    },
    {
      "symbol": "GEV",
      "name": "GE Vernova",
      "layer": "energy",
      "subcategory": "grid_power_equipment"
    },
    {
      "symbol": "FCEL",
      "name": "FuelCell Energy",
      "layer": "energy",
      "subcategory": "fuel_cells"
    },
    {
      "symbol": "PLUG",
      "name": "Plug Power",
      "layer": "energy",
      "subcategory": "hydrogen"
    },
    {
      "symbol": "VICR",
      "name": "Vicor",
      "layer": "energy",
      "subcategory": "power_conversion",
      "notes": "High-density power modules for GPUs and servers"
    },
    {
      "symbol": "OKLO",
      "name": "Oklo",
      "layer": "energy",
      "subcategory": "nuclear_smr"
    },
    {
      "symbol": "XE",
      "name": "X-Energy",
      "layer": "energy",
      "subcategory": "nuclear_smr",
      "needsVerification": true,
      "notes": "Ticker $XE needs confirmation — X-energy went public via SPAC; verify current listing"
    },
    {
      "symbol": "TE",
      "name": "T1 Energy",
      "layer": "storage_batteries",
      "subcategory": "batteries"
    },
    {
      "symbol": "ELVA",
      "name": "Electrovaya",
      "layer": "storage_batteries",
      "subcategory": "batteries"
    },
    {
      "symbol": "FLNC",
      "name": "Fluence Energy",
      "layer": "storage_batteries",
      "subcategory": "grid_storage",
      "notes": "BESS deployments alongside datacenters"
    },
    {
      "symbol": "AMPX",
      "name": "Amprius",
      "layer": "storage_batteries",
      "subcategory": "silicon_nanowire_batteries"
    },
    {
      "symbol": "EOSE",
      "name": "Eos Energy",
      "layer": "storage_batteries",
      "subcategory": "zinc_battery_storage"
    },
    {
      "symbol": "TSM",
      "name": "TSMC",
      "layer": "foundries_memory",
      "subcategory": "foundry",
      "notes": "Primary fab for NVDA, AMD, AAPL, AMZN custom silicon"
    },
    {
      "symbol": "MU",
      "name": "Micron",
      "layer": "foundries_memory",
      "subcategory": "dram_hbm_nand",
      "notes": "HBM for AI accelerators"
    },
    {
      "symbol": "SNDK",
      "name": "Sandisk",
      "layer": "foundries_memory",
      "subcategory": "flash"
    },
    {
      "symbol": "STX",
      "name": "Seagate",
      "layer": "foundries_memory",
      "subcategory": "hdd"
    },
    {
      "symbol": "WDC",
      "name": "Western Digital",
      "layer": "foundries_memory",
      "subcategory": "hdd_flash"
    },
    {
      "symbol": "MRAM",
      "name": "Everspin Technologies",
      "layer": "foundries_memory",
      "subcategory": "emerging_memory"
    },
    {
      "symbol": "P",
      "name": "Everpure",
      "layer": "foundries_memory",
      "subcategory": "unknown",
      "needsVerification": true,
      "notes": "Ticker $P needs confirmation — was Pandora before 2019 acquisition by SIRI; verify"
    },
    {
      "symbol": "DRAM",
      "name": "Themes Memory Semiconductor ETF",
      "layer": "foundries_memory",
      "subcategory": "memory_etf",
      "isEtf": true,
      "notes": "ETF holding SK hynix, MU, Samsung, SNDK, Kioxia, STX, WDC, Nanya, Winbond"
    },
    {
      "symbol": "SIMO",
      "name": "Silicon Motion",
      "layer": "foundries_memory",
      "subcategory": "ssd_controllers"
    },
    {
      "symbol": "NVDA",
      "name": "NVIDIA",
      "layer": "chip_design",
      "subcategory": "gpu_ai_accelerator"
    },
    {
      "symbol": "AMD",
      "name": "AMD",
      "layer": "chip_design",
      "subcategory": "cpu_gpu"
    },
    {
      "symbol": "INTC",
      "name": "Intel",
      "layer": "chip_design",
      "subcategory": "cpu_foundry",
      "notes": "Also operates fabs (IDM model)"
    },
    {
      "symbol": "AMBQ",
      "name": "Ambiq Micro",
      "layer": "chip_design",
      "subcategory": "ultra_low_power_ai",
      "notes": "Ultra-low-power AI chips, recent IPO"
    },
    {
      "symbol": "NVTS",
      "name": "Navitas Semiconductor",
      "layer": "chip_design",
      "subcategory": "gan_power"
    },
    {
      "symbol": "ARM",
      "name": "ARM Holdings",
      "layer": "chip_design",
      "subcategory": "ip_licensing"
    },
    {
      "symbol": "WOLF",
      "name": "Wolfspeed",
      "layer": "chip_design",
      "subcategory": "silicon_carbide",
      "notes": "Silicon carbide; financial restructuring risk"
    },
    {
      "symbol": "IONQ",
      "name": "IonQ",
      "layer": "quantum",
      "subcategory": "trapped_ion"
    },
    {
      "symbol": "QBTS",
      "name": "D-Wave Quantum",
      "layer": "quantum",
      "subcategory": "annealing"
    },
    {
      "symbol": "RGTI",
      "name": "Rigetti Computing",
      "layer": "quantum",
      "subcategory": "superconducting"
    },
    {
      "symbol": "LITE",
      "name": "Lumentum",
      "layer": "photonics",
      "subcategory": "optical_components"
    },
    {
      "symbol": "COHR",
      "name": "Coherent Corp",
      "layer": "photonics",
      "subcategory": "lasers_photonics"
    },
    {
      "symbol": "AAOI",
      "name": "Applied Optoelectronics",
      "layer": "photonics",
      "subcategory": "datacom_transceivers",
      "notes": "History of guidance misses"
    },
    {
      "symbol": "AXTI",
      "name": "AXT Inc",
      "layer": "photonics",
      "subcategory": "compound_semi_substrates"
    },
    {
      "symbol": "LWLG",
      "name": "Lightwave Logic",
      "layer": "photonics",
      "subcategory": "electro_optic_polymers",
      "notes": "Pre-revenue, speculative"
    },
    {
      "symbol": "DELL",
      "name": "Dell Technologies",
      "layer": "datacenter_infra",
      "subcategory": "servers"
    },
    {
      "symbol": "VRT",
      "name": "Vertiv",
      "layer": "datacenter_infra",
      "subcategory": "cooling_power",
      "notes": "Liquid cooling, UPS, busways — picks-and-shovels"
    },
    {
      "symbol": "CRWV",
      "name": "CoreWeave",
      "layer": "datacenter_infra",
      "subcategory": "neocloud"
    },
    {
      "symbol": "NBIS",
      "name": "Nebius",
      "layer": "datacenter_infra",
      "subcategory": "neocloud"
    },
    {
      "symbol": "IREN",
      "name": "IREN",
      "layer": "datacenter_infra",
      "subcategory": "hosting_pivot",
      "notes": "Bitcoin miner pivoting to AI compute hosting"
    },
    {
      "symbol": "HUT",
      "name": "Hut 8",
      "layer": "datacenter_infra",
      "subcategory": "hosting_pivot"
    },
    {
      "symbol": "TSLA",
      "name": "Tesla",
      "layer": "applications",
      "subcategory": "avs_robotics"
    },
    {
      "symbol": "AMZN",
      "name": "Amazon",
      "layer": "applications",
      "subcategory": "hyperscaler_robotics",
      "notes": "AWS + Trainium/Inferentia + warehouse robotics"
    },
    {
      "symbol": "RKLB",
      "name": "Rocket Lab",
      "layer": "applications",
      "subcategory": "space_launch"
    },
    {
      "symbol": "ASTS",
      "name": "AST SpaceMobile",
      "layer": "applications",
      "subcategory": "space_comms"
    },
    {
      "symbol": "PL",
      "name": "Planet Labs",
      "layer": "applications",
      "subcategory": "space_eo"
    },
    {
      "symbol": "FLY",
      "name": "Firefly Aerospace",
      "layer": "applications",
      "subcategory": "space_launch",
      "needsVerification": true,
      "notes": "Confirm ticker; Firefly went public recently"
    },
    {
      "symbol": "GILT",
      "name": "Gilat Satellite Networks",
      "layer": "applications",
      "subcategory": "satellite_comms"
    },
    {
      "symbol": "AVEX",
      "name": "Aevex Aerospace",
      "layer": "applications",
      "subcategory": "drones",
      "needsVerification": true
    },
    {
      "symbol": "ONDS",
      "name": "Ondas Holdings",
      "layer": "applications",
      "subcategory": "drones"
    },
    {
      "symbol": "UMAC",
      "name": "Unusual Machines",
      "layer": "applications",
      "subcategory": "drones"
    },
    {
      "symbol": "SATL",
      "name": "Satellogic",
      "layer": "applications",
      "subcategory": "earth_observation"
    },
    {
      "symbol": "PLTR",
      "name": "Palantir",
      "layer": "applications",
      "subcategory": "ai_software"
    },
    {
      "symbol": "OSS",
      "name": "One Stop Systems",
      "layer": "applications",
      "subcategory": "edge_compute_defense",
      "notes": "Micro-cap, illiquid"
    },
    {
      "symbol": "GOOGL",
      "name": "Alphabet",
      "layer": "applications",
      "subcategory": "hyperscaler_ai",
      "notes": "Cloud + Gemini AI + TPU custom silicon"
    },
    {
      "symbol": "NOW",
      "name": "ServiceNow",
      "layer": "applications",
      "subcategory": "enterprise_ai_software"
    },
    {
      "symbol": "HOOD",
      "name": "Robinhood",
      "layer": "applications",
      "subcategory": "fintech",
      "notes": "Watchlist only; high beta to risk-on sentiment"
    },
    {
      "symbol": "SOFI",
      "name": "SoFi Technologies",
      "layer": "applications",
      "subcategory": "fintech",
      "notes": "Watchlist only; very high beta"
    }
  ],
  "edges": [
    {
      "from": "CCJ",
      "to": "OKLO",
      "type": "fuel_supply",
      "note": "Uranium for SMR fuel"
    },
    {
      "from": "CCJ",
      "to": "XE",
      "type": "fuel_supply"
    },
    {
      "from": "LEU",
      "to": "OKLO",
      "type": "enrichment",
      "note": "HALEU fuel"
    },
    {
      "from": "LEU",
      "to": "XE",
      "type": "enrichment"
    },
    {
      "from": "UUUU",
      "to": "OKLO",
      "type": "fuel_supply"
    },
    {
      "from": "LAC",
      "to": "TE",
      "type": "lithium_supply"
    },
    {
      "from": "LAC",
      "to": "ELVA",
      "type": "lithium_supply"
    },
    {
      "from": "LAC",
      "to": "FLNC",
      "type": "lithium_supply"
    },
    {
      "from": "LAC",
      "to": "TSLA",
      "type": "lithium_supply",
      "note": "EV battery feedstock"
    },
    {
      "from": "MP",
      "to": "TSLA",
      "type": "rare_earth_magnets",
      "note": "Permanent magnets for EV motors"
    },
    {
      "from": "MP",
      "to": "VRT",
      "type": "rare_earth_magnets",
      "note": "Cooling fan motors"
    },
    {
      "from": "USAR",
      "to": "TSLA",
      "type": "rare_earth_magnets"
    },
    {
      "from": "USAR",
      "to": "AVEX",
      "type": "rare_earth_components"
    },
    {
      "from": "USAR",
      "to": "ONDS",
      "type": "rare_earth_components"
    },
    {
      "from": "USAR",
      "to": "UMAC",
      "type": "rare_earth_components"
    },
    {
      "from": "UAMY",
      "to": "TSM",
      "type": "doping_materials",
      "note": "Antimony in semiconductor manufacturing"
    },
    {
      "from": "UAMY",
      "to": "INTC",
      "type": "doping_materials"
    },
    {
      "from": "CRML",
      "to": "TSM",
      "type": "critical_minerals",
      "note": "Speculative — verify specific supply contract"
    },
    {
      "from": "TMQ",
      "to": "TSM",
      "type": "critical_minerals",
      "note": "Speculative"
    },
    {
      "from": "BE",
      "to": "CRWV",
      "type": "power_supply",
      "note": "Bloom fuel cells used for datacenter onsite power"
    },
    {
      "from": "BE",
      "to": "NBIS",
      "type": "power_supply"
    },
    {
      "from": "GEV",
      "to": "CRWV",
      "type": "grid_power"
    },
    {
      "from": "GEV",
      "to": "NBIS",
      "type": "grid_power"
    },
    {
      "from": "GEV",
      "to": "DELL",
      "type": "power_equipment"
    },
    {
      "from": "OKLO",
      "to": "CRWV",
      "type": "nuclear_power",
      "note": "SMR power for AI datacenters (announced deals)"
    },
    {
      "from": "OKLO",
      "to": "NBIS",
      "type": "nuclear_power"
    },
    {
      "from": "VICR",
      "to": "DELL",
      "type": "power_modules",
      "note": "Power conversion in servers"
    },
    {
      "from": "VICR",
      "to": "NVDA",
      "type": "power_modules",
      "note": "GPU power delivery"
    },
    {
      "from": "FCEL",
      "to": "CRWV",
      "type": "power_supply"
    },
    {
      "from": "PLUG",
      "to": "CRWV",
      "type": "power_supply"
    },
    {
      "from": "TE",
      "to": "TSLA",
      "type": "battery_supply"
    },
    {
      "from": "ELVA",
      "to": "TSLA",
      "type": "battery_supply"
    },
    {
      "from": "FLNC",
      "to": "CRWV",
      "type": "grid_storage",
      "note": "BESS backup for datacenters"
    },
    {
      "from": "FLNC",
      "to": "NBIS",
      "type": "grid_storage"
    },
    {
      "from": "TSM",
      "to": "NVDA",
      "type": "foundry_fab",
      "note": "Primary fab for NVDA GPUs"
    },
    {
      "from": "TSM",
      "to": "AMD",
      "type": "foundry_fab"
    },
    {
      "from": "TSM",
      "to": "AMZN",
      "type": "foundry_fab",
      "note": "Trainium/Graviton fab"
    },
    {
      "from": "TSM",
      "to": "TSLA",
      "type": "foundry_fab",
      "note": "FSD inference chips"
    },
    {
      "from": "MU",
      "to": "NVDA",
      "type": "memory_supply",
      "note": "HBM stacked on AI GPUs"
    },
    {
      "from": "MU",
      "to": "AMD",
      "type": "memory_supply"
    },
    {
      "from": "MU",
      "to": "DELL",
      "type": "memory_supply"
    },
    {
      "from": "MU",
      "to": "CRWV",
      "type": "memory_supply"
    },
    {
      "from": "SNDK",
      "to": "DELL",
      "type": "flash_storage"
    },
    {
      "from": "STX",
      "to": "DELL",
      "type": "hdd_storage"
    },
    {
      "from": "STX",
      "to": "CRWV",
      "type": "cold_storage"
    },
    {
      "from": "WDC",
      "to": "DELL",
      "type": "storage"
    },
    {
      "from": "WDC",
      "to": "CRWV",
      "type": "storage"
    },
    {
      "from": "MRAM",
      "to": "NVDA",
      "type": "emerging_memory",
      "note": "Niche / speculative"
    },
    {
      "from": "NVDA",
      "to": "DELL",
      "type": "gpu_supply",
      "note": "Dell sells NVDA-powered AI servers"
    },
    {
      "from": "NVDA",
      "to": "CRWV",
      "type": "gpu_supply",
      "note": "CoreWeave fleet is overwhelmingly NVDA"
    },
    {
      "from": "NVDA",
      "to": "NBIS",
      "type": "gpu_supply"
    },
    {
      "from": "NVDA",
      "to": "IREN",
      "type": "gpu_supply"
    },
    {
      "from": "NVDA",
      "to": "HUT",
      "type": "gpu_supply"
    },
    {
      "from": "AMD",
      "to": "DELL",
      "type": "cpu_gpu_supply"
    },
    {
      "from": "AMD",
      "to": "CRWV",
      "type": "cpu_gpu_supply"
    },
    {
      "from": "INTC",
      "to": "DELL",
      "type": "cpu_supply"
    },
    {
      "from": "VRT",
      "to": "CRWV",
      "type": "cooling_power",
      "note": "Liquid cooling, UPS, power distribution"
    },
    {
      "from": "VRT",
      "to": "NBIS",
      "type": "cooling_power"
    },
    {
      "from": "VRT",
      "to": "IREN",
      "type": "cooling_power"
    },
    {
      "from": "VRT",
      "to": "HUT",
      "type": "cooling_power"
    },
    {
      "from": "VRT",
      "to": "DELL",
      "type": "cooling_power"
    },
    {
      "from": "DELL",
      "to": "CRWV",
      "type": "server_supply"
    },
    {
      "from": "DELL",
      "to": "NBIS",
      "type": "server_supply"
    },
    {
      "from": "NVDA",
      "to": "TSLA",
      "type": "training_compute",
      "note": "TSLA buys NVDA GPUs for AI training"
    },
    {
      "from": "NVDA",
      "to": "AMZN",
      "type": "gpu_supply"
    },
    {
      "from": "NVDA",
      "to": "AVEX",
      "type": "edge_compute",
      "note": "Drone autonomy compute"
    },
    {
      "from": "NVDA",
      "to": "ONDS",
      "type": "edge_compute"
    },
    {
      "from": "NVDA",
      "to": "RKLB",
      "type": "avionics_compute"
    },
    {
      "from": "CRWV",
      "to": "AMZN",
      "type": "compute_capacity",
      "note": "Overlapping market for AI compute"
    },
    {
      "from": "LITE",
      "to": "CRWV",
      "type": "optical_transceiver"
    },
    {
      "from": "LITE",
      "to": "NBIS",
      "type": "optical_transceiver"
    },
    {
      "from": "LITE",
      "to": "DELL",
      "type": "optical_components"
    },
    {
      "from": "COHR",
      "to": "CRWV",
      "type": "optical_transceiver"
    },
    {
      "from": "COHR",
      "to": "NBIS",
      "type": "optical_transceiver"
    },
    {
      "from": "COHR",
      "to": "DELL",
      "type": "optical_components"
    },
    {
      "from": "AAOI",
      "to": "CRWV",
      "type": "datacom_optics"
    },
    {
      "from": "AAOI",
      "to": "NBIS",
      "type": "datacom_optics"
    },
    {
      "from": "AXTI",
      "to": "LITE",
      "type": "substrate_supply"
    },
    {
      "from": "AXTI",
      "to": "COHR",
      "type": "substrate_supply"
    },
    {
      "from": "AXTI",
      "to": "NVTS",
      "type": "substrate_supply"
    },
    {
      "from": "AMPX",
      "to": "TSLA",
      "type": "battery_supply"
    },
    {
      "from": "EOSE",
      "to": "CRWV",
      "type": "grid_storage",
      "note": "Zinc BESS for datacenter resilience"
    },
    {
      "from": "SIMO",
      "to": "SNDK",
      "type": "controller_supply"
    },
    {
      "from": "SIMO",
      "to": "WDC",
      "type": "controller_supply"
    },
    {
      "from": "NVTS",
      "to": "VICR",
      "type": "power_chip_supply",
      "note": "GaN in power conversion stages"
    },
    {
      "from": "ARM",
      "to": "NVDA",
      "type": "ip_licensing",
      "note": "ARM ISA in Grace CPU"
    },
    {
      "from": "ARM",
      "to": "AMD",
      "type": "ip_licensing"
    },
    {
      "from": "ARM",
      "to": "AMBQ",
      "type": "ip_licensing"
    },
    {
      "from": "WOLF",
      "to": "TSLA",
      "type": "sic_inverters",
      "note": "SiC in EV powertrains"
    },
    {
      "from": "PLTR",
      "to": "AMZN",
      "type": "ai_software",
      "note": "AI/data platforms; loose edge"
    },
    {
      "from": "NVDA",
      "to": "PLTR",
      "type": "gpu_supply",
      "note": "PLTR uses GPU compute"
    },
    {
      "from": "NVDA",
      "to": "OSS",
      "type": "edge_compute_chips"
    },
    {
      "from": "SATL",
      "to": "PL",
      "type": "peer_overlap",
      "note": "Both Earth observation; loose"
    }
  ],
  "macroSignals": [
    {
      "id": "uranium_spot",
      "affects": [
        "CCJ",
        "LEU",
        "UUUU",
        "OKLO",
        "XE"
      ],
      "yfinanceProxy": "URA"
    },
    {
      "id": "lithium",
      "affects": [
        "LAC",
        "TE",
        "ELVA",
        "FLNC"
      ],
      "yfinanceProxy": "LIT"
    },
    {
      "id": "rare_earths",
      "affects": [
        "MP",
        "USAR",
        "UUUU"
      ],
      "yfinanceProxy": "REMX"
    },
    {
      "id": "semiconductors",
      "affects": [
        "NVDA",
        "AMD",
        "INTC",
        "TSM",
        "MU"
      ],
      "yfinanceProxy": "SOXX"
    },
    {
      "id": "clean_energy",
      "affects": [
        "BE",
        "FCEL",
        "PLUG",
        "OKLO",
        "XE"
      ],
      "yfinanceProxy": "ICLN"
    },
    {
      "id": "ten_year_yield",
      "affects": [],
      "yfinanceProxy": "^TNX"
    },
    {
      "id": "usd_index",
      "affects": [],
      "yfinanceProxy": "DX-Y.NYB"
    },
    {
      "id": "vix",
      "affects": [],
      "yfinanceProxy": "^VIX"
    },
    {
      "id": "hyg",
      "affects": [],
      "yfinanceProxy": "HYG"
    },
    {
      "id": "lqd",
      "affects": [],
      "yfinanceProxy": "LQD"
    }
  ],
  "benchmarkEtfs": [
    "SPY",
    "QQQ",
    "SMH",
    "SOXX",
    "URA",
    "LIT",
    "REMX",
    "ICLN",
    "ROBO"
  ]
};
