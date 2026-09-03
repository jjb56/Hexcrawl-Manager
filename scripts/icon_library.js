/*
    This file contains the library of icons in a format usable by the app
*/

//========================================================================================================================================
//              Library
//========================================================================================================================================

const icon_list = [
	{
        id: "aaa_none",
        name: "Empty",
        src: "icons/empty.png",
        tags: ["all"] 
    },
    { 
        id: "oak_tree",
        name: "Oak Tree",
        src: "icons/oak.svg", 
        tags: ["terrain", "tree", "plant"] 
    },
    { 
        id: "pine_tree", 
        name: "Pine Tree", 
        src: "icons/pine-tree.svg", 
        tags: ["terrain", "tree", "plant"] 
    },
    { 
        id: "palm_tree", 
        name: "Palm Tree", 
        src: "icons/palm-tree.svg", 
        tags: ["terrain", "tree", "plant"] 
    },
    { 
        id: "bamboo",
        name: "Bamboo Tree",
        src: "icons/bamboo.svg",
        tags: ["terrain", "tree", "plant"]
    },
	{ 
		id: "cactus",
		name: "Cactus",
		src: "icons/cactus.svg",
		tags: ["terrain", "tree", "plant"]
	},
	{ 
		id: "beech_tree",
		name: "Beech Tree",
		src: "icons/beech.svg",
		tags: ["terrain", "tree", "plant"]
	},
	{ 
		id: "dead_tree",
		name: "Dead Tree",
		src: "icons/dead-wood.svg",
		tags: ["terrain", "tree", "plant"]
	},
	{ 
		id: "agave",
		name: "Agave",
		src: "icons/agave.svg",
		tags: ["terrain", "plant"]
	},
	{ 
		id: "oasis",
		name: "Oasis",
		src: "icons/oasis.svg",
		tags: ["terrain", "water"]
	},
	{ 
		id: "mountain",
		name: "Mountain",
		src: "icons/peaks.svg",
		tags: ["terrain"]
	},
	{ 
		id: "stones",
		name: "Stones",
		src: "icons/stone-pile.svg",
		tags: ["terrain"]
	},
	{ 
		id: "stalagtite",
		name: "Stalagtite",
		src: "icons/stalagtite.svg",
		tags: []
	},
	{ 
		id: "gargoyle",
		name: "Gargoyle",
		src: "icons/gargoyle.svg",
		tags: []
	},
	{ 
		id: "tools",
		name: "Tools",
		src: "icons/stone-crafting.svg",
		tags: []
	},
	{ 
		id: "wave",
		name: "Wave",
		src: "icons/big-wave.svg",
		tags: ["terrain", "water"]
	},
	{ 
		id: "snowflake",
		name: "Snowflake",
		src: "icons/snowflake-1.svg",
		tags: ["terrain", "cold", "water"]
	},
	{ 
		id: "skull",
		name: "Skull",
		src: "icons/death-skull.svg",
		tags: ["dead", "danger"]
	},
	{ 
		id: "skull_crossbones",
		name: "Skull and Crossbones",
		src: "icons/skull-crossed-bones.svg",
		tags: ["dead", "danger", "poison"]
	},
	{ 
		id: "skull_crossed_swords",
		name: "Skull and Crossed Swords",
		src: "icons/pirate-flag.svg",
		tags: ["dead", "danger", "pirate"]
	},
	{ 
		id: "skull_demon",
		name: "Demon Skull",
		src: "icons/daemon-skull.svg",
		tags: ["dead", "danger"]
	},
	{ 
		id: "sun",
		name: "Sun",
		src: "icons/sun.svg",
		tags: []
	},
	{ 
		id: "moon",
		name: "Moon",
		src: "icons/moon.svg",
		tags: []
	},
	{ 
		id: "monolith",
		name: "Monolith",
		src: "icons/dolmen.svg",
		tags: []
	},
	{ 
		id: "island",
		name: "Island",
		src: "icons/island.svg",
		tags: []
	},
	{ 
		id: "waterfall",
		name: "Waterfall",
		src: "icons/waterfall.svg",
		tags: []
	},
	{ 
		id: "well",
		name: "Well",
		src: "icons/well.svg",
		tags: []
	},
	{ 
		id: "hole",
		name: "Hole",
		src: "icons/hole.svg",
		tags: []
	},
	{ 
		id: "castle",
		name: "Castle",
		src: "icons/castle.svg",
		tags: []
	},
	{ 
		id: "city",
		name: "City",
		src: "icons/medieval-gate.svg",
		tags: []
	},
	{ 
		id: "tower",
		name: "Tower",
		src: "icons/stone-tower.svg",
		tags: []
	},
	{ 
		id: "temple",
		name: "Temple",
		src: "icons/greek-temple.svg",
		tags: []
	},
	{ 
		id: "village",
		name: "Village",
		src: "icons/village.svg",
		tags: []
	},
	{ 
		id: "ruins",
		name: "Ruins",
		src: "icons/ancient-ruins.svg",
		tags: []
	},
	{ 
		id: "dungeon",
		name: "Dungeon",
		src: "icons/dungeon-gate.svg",
		tags: []
	},
	{ 
		id: "wyvern",
		name: "Wyvern",
		src: "icons/wyvern.svg",
		tags: []
	},
	{ 
		id: "sea_serpent",
		name: "Sea Serpent",
		src: "icons/sea-dragon.svg",
		tags: []
	},
	{ 
		id: "dense_forest",
		name: "Dense Forest",
		src: "icons/forest.svg",
		tags: []
	},
	{ 
		id: "mushroom",
		name: "Mushroom",
		src: "icons/mushroom-gills.svg",
		tags: []
	},
	{ 
		id: "mountain_road",
		name: "Mountain Road",
		src: "icons/mountain-road.svg",
		tags: []
	},
	{ 
		id: "calderea",
		name: "Caldera",
		src: "icons/caldera.svg",
		tags: ["terrain", "volcano"]
	},
	{ 
		id: "boulder",
		name: "Boulder",
		src: "icons/rock.svg",
		tags: []
	},
	{ 
		id: "swamp",
		name: "Swamp",
		src: "icons/swamp.svg",
		tags: []
	},
	{ 
		id: "coral",
		name: "Coral",
		src: "icons/coral.svg",
		tags: []
	},
	{ 
		id: "grass",
		name: "Grass",
		src: "icons/high-grass.svg",
		tags: []
	},
	{ 
		id: "fog",
		name: "Fog",
		src: "icons/fog.svg",
		tags: []
	},
	{ 
		id: "thorns",
		name: "Thorns",
		src: "icons/light-thorny-triskelion.svg",
		tags: []
	},
	{ 
		id: "flowers",
		name: "Flowers",
		src: "icons/flowers.svg",
		tags: []
	},
	{ 
		id: "watchtower",
		name: "Watchtower",
		src: "icons/watchtower.svg",
		tags: []
	},
	{ 
		id: "fishing",
		name: "Fishing",
		src: "icons/fishing.svg",
		tags: []
	},
	{ 
		id: "house",
		name: "House",
		src: "icons/house.svg",
		tags: []
	},
	{ 
		id: "haunted_house",
		name: "Haunted House",
		src: "icons/spooky-house.svg",
		tags: []
	},
	{ 
		id: "lighthouse",
		name: "Lighthouse",
		src: "icons/lighthouse.svg",
		tags: []
	},
	{ 
		id: "windmill",
		name: "Windmill",
		src: "icons/windmill.svg",
		tags: []
	},
	{ 
		id: "barn",
		name: "Barn",
		src: "icons/barn.svg",
		tags: ["farm", "jeremy"]
	},
	{ 
		id: "pointy_hat",
		name: "Pointy Hat",
		src: "icons/pointy-hat.svg",
		tags: []
	},
	{ 
		id: "tavern",
		name: "Tavern",
		src: "icons/tavern-sign.svg",
		tags: []
	},
	{ 
		id: "beer",
		name: "Beer",
		src: "icons/beer-stein.svg",
		tags: []
	},
	{ 
		id: "pier",
		name: "Pier",
		src: "icons/wooden-pier.svg",
		tags: []
	},
	{ 
		id: "bridge",
		name: "Bridge",
		src: "icons/stone-bridge.svg",
		tags: []
	},
	{ 
		id: "obelisk",
		name: "Obelisk",
		src: "icons/obelisk.svg",
		tags: []
	},
	{ 
		id: "statue",
		name: "Statue",
		src: "icons/stone-bust.svg",
		tags: []
	},
	{ 
		id: "tombstone",
		name: "Tombstone",
		src: "icons/tombstone.svg",
		tags: []
	},
	{ 
		id: "crypt",
		name: "Crypt",
		src: "icons/crypt-entrance.svg",
		tags: []
	},
	{ 
		id: "coffin",
		name: "Coffin",
		src: "icons/coffin.svg",
		tags: []
	},
	{ 
		id: "cave",
		name: "Cave",
		src: "icons/cave-entrance.svg",
		tags: []
	},
	{ 
		id: "portal",
		name: "Portal",
		src: "icons/portal.svg",
		tags: []
	},
	{ 
		id: "shrine",
		name: "Shrine",
		src: "icons/fire-shrine.svg",
		tags: []
	},
	{ 
		id: "crystal",
		name: "Crystal",
		src: "icons/crystal-growth.svg",
		tags: []
	},
	{ 
		id: "gem",
		name: "Gem",
		src: "icons/crystal-shine.svg",
		tags: []
	},
	{ 
		id: "ship_wheel",
		name: "Ship Wheel",
		src: "icons/ship-wheel.svg",
		tags: []
	},
	{ 
		id: "sinking_ship",
		name: "Sinking Ship",
		src: "icons/sinking-ship.svg",
		tags: []
	},
	{ 
		id: "sailboat",
		name: "Sailboat",
		src: "icons/sailboat.svg",
		tags: []
	},
	{ 
		id: "crate",
		name: "Crate",
		src: "icons/wooden-crate.svg",
		tags: []
	},
	{ 
		id: "crown",
		name: "Crown",
		src: "icons/crown.svg",
		tags: []
	},
	{ 
		id: "throne",
		name: "Throne",
		src: "icons/stone-throne.svg",
		tags: []
	},
	{ 
		id: "shield",
		name: "Shield",
		src: "icons/checked-shield.svg",
		tags: []
	},
	{ 
		id: "crossed_swords",
		name: "Crossed Swords",
		src: "icons/crossed-swords.svg",
		tags: []
	},
	{ 
		id: "sword_stone",
		name: "Sword in Stone",
		src: "icons/sword-altar.svg",
		tags: []
	},
	{ 
		id: "swords_and_shield",
		name: "Swords and Shield",
		src: "icons/swords-emblem.svg",
		tags: []
	},
	{ 
		id: "battleaxe",
		name: "Battle Axe",
		src: "icons/battle-axe.svg",
		tags: []
	},
	{ 
		id: "bow",
		name: "Bow",
		src: "icons/high-shot.svg",
		tags: []
	},
	{ 
		id: "spear",
		name: "Spear",
		src: "icons/stone-spear.svg",
		tags: []
	},
	{ 
		id: "evil_helmet",
		name: "Evil Helmet",
		src: "icons/warlord-helmet.svg",
		tags: []
	},
	{ 
		id: "knight_helmet",
		name: "Knight Helmet",
		src: "icons/visored-helm.svg",
		tags: []
	},
	{ 
		id: "eye_circle",
		name: "Eye in Circle",
		src: "icons/semi-closed-eye.svg",
		tags: []
	},
	{ 
		id: "hand",
		name: "Hand",
		src: "icons/hand.svg",
		tags: []
	},
	{ 
		id: "fist",
		name: "Fist",
		src: "icons/fist.svg",
		tags: []
	},
	{ 
		id: "crowned_skull",
		name: "Crowned Skull",
		src: "icons/crowned-skull.svg",
		tags: []
	},
	{ 
		id: "wolf",
		name: "Wolf",
		src: "icons/wolf-head.svg",
		tags: []
	},
	{ 
		id: "bear",
		name: "Bear",
		src: "icons/bear-head.svg",
		tags: []
	}
    ,
	{ 
		id: "lion",
		name: "Lion",
		src: "icons/lion.svg",
		tags: []
	},
	{ 
		id: "eagle",
		name: "Eagle",
		src: "icons/eagle-emblem.svg",
		tags: []
	},
	{ 
		id: "snake",
		name: "Snake",
		src: "icons/snake.svg",
		tags: []
	},
	{ 
		id: "raven",
		name: "Raven",
		src: "icons/raven.svg",
		tags: []
	},
	{ 
		id: "spider",
		name: "Spider",
		src: "icons/spider-alt.svg",
		tags: []
	},
	{ 
		id: "horse",
		name: "Horse",
		src: "icons/horse-head.svg",
		tags: []
	},
	{ 
		id: "diamond",
		name: "Diamond",
		src: "icons/cut-diamond.svg",
		tags: []
	},
	{ 
		id: "campfire",
		name: "Campfire",
		src: "icons/campfire.svg",
		tags: []
	},
	{ 
		id: "compass",
		name: "Compass",
		src: "icons/compass.svg",
		tags: []
	},
	{ 
		id: "point_of_interest",
		name: "Point of Interest",
		src: "icons/position-marker.svg",
		tags: []
	},
	{ 
		id: "star",
		name: "Star",
		src: "icons/round-star.svg",
		tags: []
	},
	{ 
		id: "chest",
		name: "Chest",
		src: "icons/locked-chest.svg",
		tags: []
	}
];

console.log(`${icon_list.length} icons in library.`);