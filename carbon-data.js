// Carbon footprint factors and configuration data for EcoStep (Hackathon-ready)
const CARBON_DATA = {
  // Annual average footprint values (kg CO2e / year)
  averages: {
    global: 4000,
    us: 16000,
    europe: 6400,
    target: 2000 // IPCC target to limit warming to 1.5C
  },

  // Calculator emission factors (all outputs in kg CO2e)
  factors: {
    // Transportation: kg CO2e per km
    transport: {
      carGasoline: 0.192,
      carDiesel: 0.171,
      carHybrid: 0.110,
      carElectric: 0.045, // average grid electricity component
      motorcycle: 0.103,
      bus: 0.089,
      train: 0.035,
      shortFlight: 0.245, // < 3 hours
      longFlight: 0.150   // > 3 hours
    },
    // Home Energy: kg CO2e per unit
    energy: {
      electricityKwh: 0.385, // US average grid mix
      naturalGasM3: 2.03,
      heatingOilLiter: 2.68,
      coalKg: 2.42,
      cleanEnergyKwh: 0.015 // solar/wind lifecycle emissions
    },
    // Food & Diet: kg CO2e per day based on diet type
    diet: {
      meatHeavy: 7.26,  // > 100g meat/day
      meatMedium: 5.63, // 50-100g meat/day
      meatLight: 4.67,  // < 50g meat/day
      vegetarian: 3.81,
      vegan: 2.89
    },
    // Consumption & Shopping: kg CO2e per $ spent
    consumption: {
      clothing: 0.45,
      electronics: 0.75,
      furniture: 0.50,
      services: 0.08,
      generalGoods: 0.32
    }
  },

  // Standard interactive habits (actions) that users can pledge
  habits: [
    {
      id: 'meatless_mondays',
      title: 'Meatless Mondays',
      category: 'diet',
      difficulty: 'Easy',
      co2SavedPerMonth: 32.4, // (5.63 - 3.81) * 4.5 days/month
      description: 'Replace meat with vegetarian meals at least one day per week.',
      icon: '🥗',
      tip: 'Try hearty alternatives like lentils, beans, and roasted mushrooms to stay satisfied.'
    },
    {
      id: 'commute_by_bike',
      title: 'Active Commute',
      category: 'transport',
      difficulty: 'Medium',
      co2SavedPerMonth: 48.0, // Assumes 250km driven replaced by bike/walk per month
      description: 'Walk, cycle, or use a kick-scooter for short commutes (< 5km).',
      icon: '🚲',
      tip: 'Start with 1-2 days a week to build stamina and find the safest, most scenic routes.'
    },
    {
      id: 'led_bulb_swap',
      title: 'LED Lighting Upgrade',
      category: 'energy',
      difficulty: 'Easy',
      co2SavedPerMonth: 12.5, // Replaced 5 incandescent bulbs with LED
      description: 'Replace the remaining incandescent bulbs in your home with smart LEDs.',
      icon: '💡',
      tip: 'LEDs use up to 85% less energy and last up to 25 times longer than traditional bulbs.'
    },
    {
      id: 'cold_water_wash',
      title: 'Cold Water Laundry',
      category: 'energy',
      difficulty: 'Easy',
      co2SavedPerMonth: 8.4, // Assumes 8 loads/month washing with cold instead of hot water
      description: 'Wash all clothes at 30°C or cold settings instead of warm/hot.',
      icon: '🧼',
      tip: 'Around 75-90% of a washing machine\'s energy goes directly into heating the water.'
    },
    {
      id: 'line_dry_clothes',
      title: 'Line Dry Clothes',
      category: 'energy',
      difficulty: 'Easy',
      co2SavedPerMonth: 22.0, // Replaces tumble drying 8 loads/month
      description: 'Air-dry your laundry on a drying rack or clothesline.',
      icon: '👕',
      tip: 'Tumble dryers are one of the most energy-hungry appliances in the average household.'
    },
    {
      id: 'reduce_food_waste',
      title: 'Zero Waste Kitchen',
      category: 'diet',
      difficulty: 'Medium',
      co2SavedPerMonth: 15.0, // Saving ~10kg of food waste/month
      description: 'Plan meals, store food properly, and eat leftovers to achieve zero waste.',
      icon: '🍎',
      tip: 'Use a shopping list, freeze excess ingredients, and turn leftovers into creative new dishes.'
    },
    {
      id: 'smart_power_strips',
      title: 'Unplug Standby Load',
      category: 'energy',
      difficulty: 'Easy',
      co2SavedPerMonth: 6.5, // Eliminates phantom loads from electronics
      description: 'Unplug chargers and use smart power strips to shut off idle electronics.',
      icon: '🔌',
      tip: 'Standby power accounts for up to 10% of your home electricity bill.'
    },
    {
      id: 'public_transit_swap',
      title: 'Transit transition',
      category: 'transport',
      difficulty: 'Medium',
      co2SavedPerMonth: 75.0, // Replaces 500km gas driving with public transit per month
      description: 'Use trains, metros, or buses instead of driving your car solo.',
      icon: '🚊',
      tip: 'Use your commute to read, catch up on emails, or relax instead of navigating traffic.'
    }
  ],

  // Loggable activities for the daily tracking feature
  loggableActions: [
    // Transportation
    {
      id: 'log_walk_bike',
      name: 'Walk/Bike Commute',
      category: 'transport',
      unit: 'km',
      co2SavedPerUnit: 0.192, // Relative to driving a standard gas car
      icon: '🚶‍♂️',
      placeholder: 'Distance (e.g. 5)'
    },
    {
      id: 'log_transit',
      name: 'Public Transit Ride',
      category: 'transport',
      unit: 'km',
      co2SavedPerUnit: 0.103, // Saved vs driving (0.192 - 0.089)
      icon: '🚌',
      placeholder: 'Distance (e.g. 15)'
    },
    {
      id: 'log_carpool',
      name: 'Shared Ride / Carpool',
      category: 'transport',
      unit: 'km',
      co2SavedPerUnit: 0.096, // Assumes splitting emission in half
      icon: '🚗',
      placeholder: 'Distance (e.g. 20)'
    },
    // Diet
    {
      id: 'log_vegan_meal',
      name: 'Vegan Meal Day',
      category: 'diet',
      unit: 'meals',
      co2SavedPerUnit: 1.45, // Saved vs medium meat diet per meal (5.63 - 2.89) / 3 meals
      icon: '🌱',
      placeholder: 'Number of meals (e.g. 3)'
    },
    {
      id: 'log_veg_meal',
      name: 'Vegetarian Meal Day',
      category: 'diet',
      unit: 'meals',
      co2SavedPerUnit: 0.60, // Saved vs medium meat diet per meal (5.63 - 3.81) / 3 meals
      icon: '🥚',
      placeholder: 'Number of meals (e.g. 3)'
    },
    // Energy & Home
    {
      id: 'log_thermostat',
      name: 'Eco Thermostat Adj.',
      category: 'energy',
      unit: 'hours',
      co2SavedPerUnit: 0.25, // heating/cooling reduction per hour
      icon: '🌡️',
      placeholder: 'Hours adjusted (e.g. 8)'
    },
    {
      id: 'log_short_shower',
      name: 'Short Shower (<5 min)',
      category: 'energy',
      unit: 'showers',
      co2SavedPerUnit: 0.40, // saved water heating carbon
      icon: '🚿',
      placeholder: 'Number of showers (e.g. 1)'
    }
  ],

  // AI Insights templates based on carbon high sectors
  insights: {
    transport: {
      title: 'Optimize Your Commute',
      short: 'Your transportation footprint is above the eco-average.',
      text: 'Transportation is your highest carbon contributor. Transitioning just 20% of your single-occupancy driving trips to transit, biking, or walking can reduce your annual footprint by up to 800 kg CO2e. If buying a new vehicle, consider hybrid or electric options, which cut direct emissions by over 50%.'
    },
    energy: {
      title: 'Empower Your Home Efficiency',
      short: 'Your utility carbon footprint suggests energy leakage.',
      text: 'Heating, cooling, and old appliances represent massive opportunities for carbon reduction. Swapping incandescent bulbs for LEDs saves up to 85% of lighting power. Investing in a smart programmable thermostat can shave 10-15% off utility bills and carbon. Consider contacting your local utility for a home energy audit.'
    },
    diet: {
      title: 'Nourish Your Body and Planet',
      short: 'Your diet accounts for a significant share of emissions.',
      text: 'Animal products, especially red meat and dairy, require exponentially more land, water, and feed than plants. Choosing vegan or vegetarian meals just 3 days a week cuts food-related greenhouse gases by 30%. Focus on adding delicious plant-based proteins like legumes, tofu, and nuts to your regular rotation.'
    },
    consumption: {
      title: 'Embrace Mindful Consumption',
      short: 'Your shopping habits contribute highly to production emissions.',
      text: 'Every new item bought represents carbon from extraction, manufacturing, and global shipping. Try the "30-day rule" (wait 30 days before buying a non-essential item) to avoid impulse buys. Shopping second-hand, repairing broken items, and buying high-quality goods that last longer can slash consumption footprint by 40%.'
    },
    balanced: {
      title: 'Keep Up the Eco-Balance!',
      short: 'You have a well-balanced carbon footprint distribution.',
      text: 'Your footprint is evenly distributed and relatively low. To reach the IPCC target of 2,000 kg CO2e/year, focus on continuous daily logging, adopting medium-difficulty habits, and spreading the word to friends and family. Your collective actions lead the way!'
    }
  }
};
