// Worlds and stars you can tap in the sky. Plain, well-established facts for a young audience. Checked against the NASA pages listed in SKY_SOURCES below.
export type Body = { id: string; name: string; kind: string; color: string; facts: string[]; fun: string; say: string };

export const BODIES: Record<string, Body> = {
  earth: { id: "earth", name: "Earth", kind: "Planet · our home", color: "#5fa8ff",
    facts: ["Earth is the third planet from the Sun, and the only world we know of that has life.", "About 71% of its surface is covered by water.", "It is about 12,756 km across at the equator.", "The Moon is its only natural satellite."],
    fun: "From the Moon, Earth looks like a bright blue marble hanging in the black sky.", say: "This is Earth. Our home, and the only world we know that has life." },
  venus: { id: "venus", name: "Venus", kind: "Planet", color: "#e8d3a0",
    facts: ["Venus is the second planet from the Sun, and the hottest, with an average temperature of about 464 °C.", "Its thick carbon dioxide atmosphere traps heat, like a giant greenhouse.", "It spins backwards compared with most planets, and it takes about 243 Earth days to turn once, longer than its 225-day year.", "Venus has no moons."],
    fun: "Venus is hotter than Mercury, even though Mercury is much closer to the Sun.", say: "This is Venus, the hottest planet in the solar system." },
  jupiter: { id: "jupiter", name: "Jupiter", kind: "Planet · gas giant", color: "#d9a36f",
    facts: ["Jupiter is the largest planet. More than 1,300 Earths could fit inside it.", "It is a gas giant, made mostly of hydrogen and helium.", "The Great Red Spot is a storm bigger than Earth that has been watched for well over a century.", "A day on Jupiter lasts only about 10 hours."],
    fun: "Jupiter spins so fast that it bulges at the middle.", say: "This is Jupiter, the biggest planet of all." },
  saturn: { id: "saturn", name: "Saturn", kind: "Planet · gas giant", color: "#ecdcb0",
    facts: ["Saturn is the second-largest planet.", "Its rings are made of countless pieces of ice and rock, from tiny grains to big boulders.", "Saturn is so light for its size that it is less dense than water.", "Its largest moon, Titan, has a thick atmosphere and lakes of liquid methane and ethane."],
    fun: "If you had a bathtub big enough, Saturn would float in it.", say: "This is Saturn, famous for its beautiful rings." },
  uranus: { id: "uranus", name: "Uranus", kind: "Planet · ice giant", color: "#9ee6ee",
    facts: ["Uranus is an ice giant that spins tilted on its side.", "Its blue-green color comes from methane in its atmosphere.", "It takes about 84 Earth years to travel once around the Sun."],
    fun: "Uranus rolls around the Sun like a ball, instead of spinning like a top.", say: "This is Uranus, the planet that spins on its side." },
  neptune: { id: "neptune", name: "Neptune", kind: "Planet · ice giant", color: "#5b7dff",
    facts: ["Neptune is the farthest planet from the Sun.", "It has the fastest winds measured on any planet, more than 2,000 km/h.", "One year on Neptune lasts about 165 Earth years."],
    fun: "Neptune was found using math before anyone saw it through a telescope.", say: "This is Neptune, a deep blue world with supersonic winds." },
  sun: { id: "sun", name: "The Sun", kind: "Star", color: "#ffd27a",
    facts: ["The Sun is a star: a giant ball of hot gas at the center of our solar system.", "It holds about 99.8% of all the mass in the solar system.", "Sunlight takes about 8 minutes and 20 seconds to reach Earth.", "The Sun is about 109 times wider than Earth."],
    fun: "Every sunrise you have ever seen is light that left the Sun just over eight minutes earlier.", say: "This is our Sun. A star, and the source of nearly all our light." },
  moon: { id: "moon", name: "The Moon", kind: "Moon · Earth’s companion", color: "#7FD6FF",
    facts: ["The Moon is Earth’s only natural satellite, and the fifth-largest moon in the solar system.", "It is about 384,400 km from Earth on average.", "Its surface is covered in craters made by asteroid and comet impacts.", "Twelve people have walked on it, all during Apollo missions between 1969 and 1972."],
    fun: "The machines you are meeting here are the ones people left behind.", say: "This is the Moon, Earth’s companion." },
  mars: { id: "mars", name: "Mars", kind: "Planet · the Red Planet", color: "#FF7A45",
    facts: ["Mars is the fourth planet from the Sun, and looks red because of rusty iron in its dust.", "It has two tiny moons, Phobos and Deimos.", "Olympus Mons, the tallest volcano in the solar system, is about 22 km high.", "A day on Mars, called a sol, lasts about 24 hours and 40 minutes."],
    fun: "Every rover you meet here landed on a world with a sky that is butterscotch in the daytime.", say: "This is Mars, the Red Planet." },
};
export const BODY_IDS = Object.keys(BODIES);

// NASA pages used to check the sky facts above (shown on the Credits page).
export const SKY_SOURCES: { title: string; publisher: string; url: string }[] = [
  { title: "Planetary Fact Sheet (sizes, days, years, temperatures, moons)", publisher: "NASA NSSDCA", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/index.html" },
  { title: "Neptune Facts (winds, most distant planet)", publisher: "NASA Science", url: "https://science.nasa.gov/neptune/facts/" },
  { title: "All About the Sun (8 minutes 20 seconds of sunlight)", publisher: "NASA Space Place", url: "https://spaceplace.nasa.gov/all-about-the-sun" },
  { title: "A Storm of Change (Great Red Spot)", publisher: "NASA Science", url: "https://science.nasa.gov/photojournal/a-storm-of-change/" },
];
