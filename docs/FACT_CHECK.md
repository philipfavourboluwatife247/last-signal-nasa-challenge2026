# Fact-check checklist

Every claim a player can read, with the NASA source to check it against. Generated from `content/machines/*.json`.

**How the `verified` status was earned:** on 14 November 2026 each date, number and place below was matched to the NASA pages listed for that machine, using web search and page fetches. This was an **AI-assisted check (Claude), not a human review**. The reviewer line in each dossier says so. When a person has read this list and agrees, change `review.reviewer` in the dossier to their name.

Sky-card facts (planets, Sun, Moon) are checked against the pages in `SKY_SOURCES` in `lib/bodies.ts`. Three are not yet matched to a specific NASA page: Earth's 71% water, Titan's methane and ethane lakes, and Olympus Mons being about 22 km high.

Known source differences: NASA lists the Apollo 17 rover distance as 35.9 km (NSSDCA) and about 35.7 km elsewhere; Phoenix's "more than five months" is derived from landing (25 May 2008) and last signal (2 Nov 2008).


## Surveyor 3  (Moon)

- Site: Oceanus Procellarum at 3.016° S, 23.418° W
- Arrived: 1967-04-20; status: silent; last contact: 1967-05-04
- Photos returned: about 6,300  (source id: nasa-s3)
- Apollo 12 landing distance: about 180 m  (source id: nasa-s3)
- Timeline 1967-04-20: Touchdown
- Timeline 1967-05-04: Last contact
- Timeline 1969-11: A visit from Apollo 12
- Sources:
  - NASA Science: Surveyor 3 <https://science.nasa.gov/mission/lunar-rangers-and-surveyors/surveyor-3/>
  - NASA NSSDCA: Apollo 12 and Surveyor 3 on the Moon (image record) <https://nssdc.gsfc.nasa.gov/imgcat/html/object_page/a12_h_48_7133.html>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Apollo 11 Lunar Module Eagle  (Moon)

- Site: Tranquility Base, Sea of Tranquility at 0.674° N, 23.473° E
- Arrived: 1969-07-20; status: silent; last contact: 1969-07-21
- Landed: July 20, 1969  (source id: alsj-a11)
- Time on the surface: 21.6 hours  (source id: alsj-a11)
- Timeline 1969-07-16: Launch toward the Moon
- Timeline 1969-07-20: The Eagle has landed
- Timeline 1969-07-21: Liftoff for home
- Sources:
  - NASA: Apollo 11 Overview (Apollo Lunar Surface Journal) <https://nasa.gov/wp-content/uploads/static/history/alsj/a11/a11ov.html>
  - Smithsonian National Air and Space Museum: Apollo 11 Moon Landing <https://airandspace.si.edu/apollo-missions/apollo-11-moon-landing>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Apollo 11 Laser Mirror  (Moon)

- Site: Tranquility Base, Sea of Tranquility at 0.67° N, 23.47° E
- Arrived: 1969-07-20; status: active
- Mirrors in the array: about 100  (source id: nasa-2004)
- Placed on the Moon: July 21, 1969  (source id: nasa-2004)
- Timeline 1969-07-20: Eagle lands
- Timeline 1969-07-21: A mirror panel is set up
- Timeline 2019-07-20: Still working, 50 years later
- Sources:
  - NASA: Apollo 11 Science Experiment Still Running (2004) <https://www.nasa.gov/vision/space/features/21jul_llr.html>
  - NASA/JPL: Apollo 11 Experiment Still Going Strong After 35 Years <https://www.jpl.nasa.gov/news/apollo-11-experiment-still-going-strong-after-35-years/>
  - IEEE Spectrum: One Apollo 11 Experiment Is Still Going 50 Years Later <https://spectrum.ieee.org/one-apollo-11-experiment-is-still-going-50-years-later>
  - NASA Goddard: Reflectors placed on the moon by Apollo 11 astronauts 50 years ago continue to provide fresh lunar laser ranging data <https://earth.gsfc.nasa.gov/geo/projects/sgp/updates/reflectors-placed-moon-apollo-11-astronauts-50-years-ago-continue-provide>
  - NASA ILRS: Next Generation Lunar Retroreflector-1 (mentions the Apollo reflectors) <https://ilrs.gsfc.nasa.gov/missions/satellite_missions/current_missions/ngl1_general.html>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Apollo 14 Lunar Module Antares  (Moon)

- Site: Fra Mauro highlands at 3.645° S, 17.471° W
- Arrived: 1971-02-05; status: silent; last contact: 1971-02-06
- Landed: February 5, 1971  (source id: pds-a14)
- Time on moonwalks: 9 hours 23 minutes  (source id: pds-a14)
- Timeline 1971-01-31: Launch toward the Moon
- Timeline 1971-02-05: Landing at Fra Mauro
- Timeline 1971-02-06: Liftoff for home
- Sources:
  - NASA PDS Geosciences Node: Apollo 14 Mission Overview <https://pds-geosciences.wustl.edu/lunar/urn-nasa-pds-apollodoc/document_a14/mission/a14_mission.txt>
  - NASA PDS Geosciences Node: Apollo 14 Lunar Module Instrument Host Overview <https://pds-geosciences.wustl.edu/lunar/urn-nasa-pds-apollodoc/document_a14/instrument_hosts/a14l_lm.txt>
  - NASA: Apollo 14 mission page <https://www.nasa.gov/mission_pages/apollo/missions/apollo14.html>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Apollo 15 Lunar Rover  (Moon)

- Site: Hadley–Apennine region at 26.13° N, 3.63° E
- Arrived: 1971-07-30; status: silent; last contact: 1971-08-02
- Distance driven (Apollo 15): 27.8 km  (source id: nssdca-lrv)
- Timeline 1971-07-30: Landing at Hadley–Apennine
- Timeline 1971-07-31: The first drive
- Timeline 1971-08-02: Parked for good
- Sources:
  - NASA Johnson Space Center: The Apollo 15 Mission (NASA JSC) <https://www-curator.jsc.nasa.gov/lunar/catalogs/apollo15/part1/apollo15mission.pdf>
  - NASA NSSDCA: The Apollo Lunar Roving Vehicle <https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Apollo 16 Lunar Rover  (Moon)

- Site: Descartes Highlands at 8.97° S, 15.5° E
- Arrived: 1972-04-21; status: silent; last contact: 1972-04-23
- Distance driven (Apollo 16): 26.7 km  (source id: nssdca-lrv)
- Moonwalks with the rover: 3  (source id: pds-a16)
- Timeline 1972-04-21: Landing at Descartes
- Timeline 1972-04-22: Up Stone Mountain
- Timeline 1972-04-23: Parked for good
- Sources:
  - NASA NSSDCA: The Apollo Lunar Roving Vehicle <https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html>
  - NASA PDS Geosciences Node: Apollo 16 Mission Overview (surface operations) <https://pds-geosciences.wustl.edu/lunar/urn-nasa-pds-a16lsrp_soil_mechanics/document/a16_mission.txt>
  - NASA: Apollo 16 Heads Home to Earth <https://www.nasa.gov/history/apollo-16-heads-home-to-earth/>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Apollo 17 Lunar Rover  (Moon)

- Site: Taurus–Littrow valley at 20.19° N, 30.77° E
- Arrived: 1972-12-11; status: silent; last contact: 1972-12-13
- Distance driven (Apollo 17): about 35.9 km  (source id: nssdca-lrv)
- Farthest from the lander: 7.6 km  (source id: nssdca-lrv)
- Timeline 1972-12-11: Landing in Taurus–Littrow
- Timeline 1972-12-12: Out to Nansen crater
- Timeline 1972-12-13: The last moonwalk
- Sources:
  - NASA NSSDCA: The Apollo Lunar Roving Vehicle <https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html>
  - NASA PDS Geosciences Node: Apollo 17 Mission Overview (surface operations) <https://pds-geosciences.wustl.edu/Lunar/urn-nasa-pds-a17tg_traverse_gravity/document/a17_mission.txt>
  - NASA: Cernan beside the Lunar Roving Vehicle during the third moonwalk, 13 December 1972 <https://www.nasa.gov/image-detail/amf-as17-134-20476/>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Viking 1  (Mars)

- Site: Chryse Planitia at 22.7° N, 47.95° W
- Arrived: 1976-07-20; status: silent; last contact: 1982-11-11
- Landed: July 20, 1976  (source id: jpl-viking)
- Contact lost: November 1982  (source id: jpl-viking)
- Timeline 1976-07-20: Touchdown in Chryse Planitia
- Timeline 1982-11-11: The signal fades
- Sources:
  - NASA/JPL: Attempts to Communicate to Viking Lander 1 Concluded <https://www.jpl.nasa.gov/news/attempts-to-communicate-to-viking-lander-1-concluded/>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Viking 2  (Mars)

- Site: Utopia Planitia at 47.64° N, 134.29° E
- Arrived: 1976-09-03; status: silent; last contact: 1980-04-11
- Landed: September 3, 1976  (source id: nasa-viking2)
- Last data received: April 11, 1980  (source id: nasa-viking2)
- Timeline 1976-08-07: Into orbit
- Timeline 1976-09-03: Touchdown on Utopia Planitia
- Timeline 1980-04-11: The last data
- Sources:
  - NASA Science: Viking 2 <https://science.nasa.gov/mission/viking/viking-2>
  - NASA NSSDCA: Viking Mission to Mars <https://nssdc.gsfc.nasa.gov/planetary/viking.html>
  - NASA Goddard Space Flight Center: Viking 2 – Utopia Planitia <https://science.gsfc.nasa.gov/attic/mola/viking2.html>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Sojourner and Pathfinder  (Mars)

- Site: Ares Vallis at 19.13° N, 33.22° W
- Arrived: 1997-07-04; status: silent; last contact: 1997-09-27
- Planned rover mission: 7 sols  (source id: pf-summary)
- Rover operated: 83 sols  (source id: pf-summary)
- Timeline 1997-07-04: Landing on Mars
- Timeline 1997-09-27: Last transmission
- Sources:
  - NASA/JPL: Sojourner’s Farthest Journey (Mars Pathfinder, Sol 75) <https://science.nasa.gov/resource/sojourners-farthest-journey/>
  - NASA/JPL: Mars Pathfinder (NASA Facts, archived copy) <https://webarchive.library.unt.edu/web/20090813031850/http:/jpl.nasa.gov/news/fact_sheets/mpf.pdf>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Spirit  (Mars)

- Site: Gusev crater at 14.57° S, 175.47° E
- Arrived: 2004-01-04; status: silent; last contact: 2010-03-22
- Planned mission: 90 sols  (source id: mer)
- Last contact: March 22, 2010  (source id: mer)
- Timeline 2004-01-04: Landing in Gusev crater
- Timeline 2009: Stuck in soft sand
- Timeline 2010-03-22: Last contact
- Timeline 2011-05-25: Recovery efforts end
- Sources:
  - NASA Science: Mars Exploration Rovers: Spirit and Opportunity <https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/>
  - NASA Science: Mars Exploration Rover – Spirit <https://science.nasa.gov/mission/mer-spirit/>
  - NASA/JPL: NASA Concludes Attempts to Contact Mars Rover Spirit <https://www.jpl.nasa.gov/news/nasa-concludes-attempts-to-contact-mars-rover-spirit/>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Opportunity  (Mars)

- Site: Meridiani Planum at 1.95° S, 5.53° W
- Arrived: 2004-01-25; status: silent; last contact: 2018-06-10
- Planned mission: 90 sols  (source id: mer)
- Distance driven: 45.16 km  (source id: mer)
- Timeline 2004-01-25: Landing at Meridiani Planum
- Timeline 2018-06-10: Last contact, in a dust storm
- Timeline 2019-02-13: Mission complete
- Sources:
  - NASA Science: Mars Exploration Rovers: Spirit and Opportunity <https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Phoenix  (Mars)

- Site: Green Valley, Vastitas Borealis at 68.22° N, 125.75° W
- Arrived: 2008-05-25; status: silent; last contact: 2008-11-02
- Landed: May 25, 2008  (source id: nasa-phoenix)
- Last signal: November 2, 2008  (source id: nasa-phoenix)
- Landing latitude: about 68.2° N  (source id: nasa-phoenix)
- Timeline 2008-05-25: Landing in the Martian arctic
- Timeline 2008-07-31: Water ice confirmed
- Timeline 2008-11-02: The last signal
- Sources:
  - NASA Science: Phoenix <https://science.nasa.gov/mission/phoenix>
  - NASA History: 15 Years Ago: Phoenix Mars Lander Launches to the Red Planet <https://www.nasa.gov/history/15-years-ago-phoenix-mars-lander-launches-to-the-red-planet>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## InSight  (Mars)

- Site: Elysium Planitia at 4.5° N, 135.62° E
- Arrived: 2018-11-26; status: silent; last contact: 2022-12-15
- Marsquakes detected: more than 1,300  (source id: nasa-insight)
- Last contact: December 15, 2022  (source id: nasa-insight)
- Timeline 2018-11-26: Landing at Elysium Planitia
- Timeline 2022-05-04: A magnitude 5 marsquake
- Timeline 2022-12-15: Last contact
- Timeline 2022-12-21: Mission declared over
- Sources:
  - NASA: NASA InSight blog: December 19, 2022 <https://blogs.nasa.gov/insight/2022/12/19/nasa-insight-dec-19-2022/>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14

## Ingenuity  (Mars)

- Site: Jezero crater (Wright Brothers Field) at 18.44° N, 77.45° E
- Arrived: 2021-02-18; status: silent; last contact: 2024-01-18
- Flights flown: 72  (source id: nasa-ingenuity)
- Total distance: about 17 km  (source id: nasa-ingenuity)
- Planned flights: up to 5  (source id: nasa-ingenuity)
- Timeline 2021-02-18: Arrival with Perseverance
- Timeline 2021-04-19: First flight
- Timeline 2024-01-18: Flight 72
- Timeline 2024-01-25: Mission ends
- Sources:
  - NASA (Jan 25, 2024): After Three Years on Mars, NASA’s Ingenuity Helicopter Mission Ends <https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/>
- Review: verified by AI-assisted check against NASA sources (Claude) on 2026-11-14
