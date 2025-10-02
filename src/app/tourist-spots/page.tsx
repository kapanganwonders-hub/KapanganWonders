'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface TouristSpot {
  id: number;
  name: string;
  description: string;
  image: string;
  location: string;
  barangay: string;
  category: string;
  contact?: string;
  entranceFee?: string;
  googleMapsLink?: string;
  detailedDescription?: string;
}

export default function TouristSpots() {
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const spots: TouristSpot[] = [
    {
      id: 1,
      name: "Ampongot Rice Terraces",
      description: "Stunning rice terraces in Sagubo showcasing traditional Ifugao farming methods and breathtaking mountain views.",
      image: "/assets/Ampongot Rice Terraces (Sagubo).jpg",
      location: "Sagubo, Kapangan",
      barangay: "Sagubo",
      category: "Agricultural Heritage",
      contact: "Barangay Sagubo Office: +63 917 123 4567",
      entranceFee: "Free",
      googleMapsLink: "https://maps.google.com/?q=Ampongot+Rice+Terraces+Sagubo+Kapangan+Benguet",
      detailedDescription: "The Ampongot Rice Terraces in Sagubo represent one of the most beautiful examples of traditional Ifugao agricultural engineering. These terraces, carved into the mountainside over generations, showcase the incredible skill and dedication of the Igorot people. The terraces follow the natural contours of the land, creating a stunning stepped landscape that changes with the seasons. During planting season, the terraces are filled with water, creating a mirror effect that reflects the sky and surrounding mountains. The harvest season brings golden waves of rice that cascade down the mountainside. Visitors can witness traditional farming methods still practiced today, including the use of water buffalo for plowing and the careful maintenance of the irrigation system that has sustained these terraces for centuries."
    },
    {
      id: 2,
      name: "Amburayan Bridge",
      description: "A beautiful bridge crossing the Amburayan River, offering picturesque views of the surrounding landscape.",
      image: "/assets/Amburayan Bridge (Cuba).jpg",
      location: "Cuba, Kapangan",
      barangay: "Cuba",
      category: "Infrastructure",
      contact: "Barangay Cuba Office: +63 918 234 5678",
      entranceFee: "Free",
      googleMapsLink: "https://maps.google.com/?q=Amburayan+Bridge+Cuba+Kapangan+Benguet",
      detailedDescription: "The Amburayan Bridge in Cuba is not just a functional crossing over the Amburayan River, but also a scenic landmark that offers visitors breathtaking views of the surrounding Cordillera landscape. This modern bridge provides safe passage while allowing visitors to pause and appreciate the natural beauty of the Amburayan River below. The bridge serves as a perfect spot for photography, especially during sunrise and sunset when the light reflects beautifully off the water. The area around the bridge is also popular for fishing and river activities, making it a great starting point for exploring the natural wonders of Cuba barangay."
    },
    {
      id: 3,
      name: "Amburayan River",
      description: "A pristine river in Taba-ao perfect for nature lovers and those seeking peaceful moments by the water.",
      image: "/assets/Amburayan River (Taba-ao).jpg",
      location: "Taba-ao, Kapangan",
      barangay: "Taba-ao",
      category: "Natural Attractions",
      contact: "Barangay Taba-ao Office: +63 918 345 6789",
      entranceFee: "Free",
      googleMapsLink: "https://maps.google.com/?q=Amburayan+River+Taba-ao+Kapangan+Benguet",
      detailedDescription: "The Amburayan River in Taba-ao is a crystal-clear mountain river that flows through the heart of Kapangan, offering visitors a serene escape into nature. This pristine waterway is perfect for swimming, fishing, and simply enjoying the peaceful sounds of flowing water. The river is surrounded by lush vegetation and towering mountains, creating a picturesque setting that's ideal for photography and relaxation. During the dry season, the river reveals beautiful rock formations and shallow pools perfect for wading, while the rainy season brings rushing waters that create a more dramatic landscape. The area around the river is also popular for picnics and family gatherings, making it a favorite destination for both locals and tourists seeking a natural retreat."
    },
    {
      id: 4,
      name: "Badi Falls",
      description: "A hidden gem waterfall in Sagubo offering a refreshing escape into nature's beauty.",
      image: "/assets/Badi Falls (Sagubo).jpg",
      location: "Sagubo, Kapangan",
      barangay: "Sagubo",
      category: "Waterfalls",
      contact: "Barangay Sagubo Office: +63 917 123 4567",
      entranceFee: "₱50 per person",
      googleMapsLink: "https://maps.google.com/?q=Badi+Falls+Sagubo+Kapangan+Benguet",
      detailedDescription: "Badi Falls is a spectacular hidden waterfall nestled in the lush forests of Sagubo. This natural wonder cascades down rocky cliffs into a crystal-clear pool below, creating a perfect spot for swimming and relaxation. The falls are surrounded by dense vegetation and towering trees, providing a cool and refreshing atmosphere even during hot summer days. The journey to Badi Falls involves a moderate hike through scenic mountain trails, making it an ideal destination for nature lovers and adventure seekers. The sound of rushing water and the peaceful forest setting create a truly magical experience that's perfect for photography and quiet contemplation."
    },
    {
      id: 5,
      name: "Beleng-Belis Viewing Area",
      description: "A panoramic viewing deck offering spectacular views of Kapangan's natural landscape and mountains.",
      image: "/assets/Beleng-Belis Viewing Area.jpg",
      location: "Kapangan",
      barangay: "Central",
      category: "Viewing Areas",
      contact: "Kapangan Tourism Office: +63 919 345 6789",
      entranceFee: "Free",
      googleMapsLink: "https://maps.google.com/?q=Beleng-Belis+Viewing+Area+Central+Kapangan+Benguet",
      detailedDescription: "The Beleng-Belis Viewing Area is one of Kapangan's most spectacular viewpoints, offering visitors a breathtaking panoramic view of the entire municipality and its surrounding mountain ranges. This elevated platform provides an unobstructed 360-degree view of the Cordillera landscape, making it a perfect spot for photography and sightseeing. The viewing area is particularly stunning during sunrise and sunset when the golden light illuminates the terraced mountains and valleys below. Visitors can see the intricate patterns of rice terraces, the winding Amburayan River, and the distant peaks of the Cordillera mountains. The site is easily accessible and features comfortable seating areas where visitors can relax and take in the magnificent scenery. It's also a popular spot for local events and cultural celebrations, making it a hub of community activity."
    },
    {
      id: 6,
      name: "Burcio's Anthurium Forest",
      description: "A beautiful garden in Labueg showcasing vibrant anthurium flowers and tropical plants.",
      image: "/assets/Burcio_s Anthurium Forest (Labueg) (1).jpg",
      location: "Labueg, Kapangan",
      barangay: "Labueg",
      category: "Gardens & Farms",
      contact: "Burcio's Farm: +63 917 456 7890",
      entranceFee: "₱30 per person",
      googleMapsLink: "https://maps.google.com/?q=Burcio+Anthurium+Forest+Labueg+Kapangan+Benguet",
      detailedDescription: "Burcio's Anthurium Forest is a stunning botanical garden in Labueg that showcases the incredible diversity of anthurium flowers and other tropical plants. This privately-owned garden features thousands of anthurium plants in various colors, sizes, and species, creating a vibrant and colorful landscape that's perfect for photography and nature appreciation. The garden is meticulously maintained by the Burcio family, who have been cultivating anthuriums for generations. Visitors can learn about different anthurium varieties, their growing conditions, and the traditional methods used to care for these beautiful flowers. The garden also features walking paths that wind through the flower beds, allowing visitors to get up close with the plants and enjoy the peaceful atmosphere. It's an ideal destination for flower enthusiasts, photographers, and anyone who appreciates the beauty of tropical flora."
    },
    {
      id: 7,
      name: "Camp Utopia",
      description: "An ideal camping destination in Sagubo surrounded by nature and perfect for outdoor enthusiasts.",
      image: "/assets/Camp Utopia (Sagubo).jpg",
      location: "Sagubo, Kapangan",
      barangay: "Sagubo",
      category: "Adventure & Recreation",
      contact: "Camp Utopia: +63 917 123 4567",
      entranceFee: "₱100 per person (includes camping fee)",
      googleMapsLink: "https://maps.google.com/?q=Camp+Utopia+Sagubo+Kapangan+Benguet",
      detailedDescription: "Camp Utopia is a premier camping destination in Sagubo that offers outdoor enthusiasts the perfect blend of adventure and comfort. This well-maintained campsite is surrounded by pristine mountain forests and offers stunning views of the surrounding Cordillera landscape. The camp features designated camping areas, clean restroom facilities, and basic amenities for a comfortable outdoor experience. Visitors can enjoy various activities including hiking, bird watching, stargazing, and simply relaxing in the peaceful natural environment. The camp is particularly popular during the dry season when the weather is perfect for overnight stays. The area around Camp Utopia also offers access to nearby hiking trails and scenic viewpoints, making it an ideal base for exploring the natural wonders of Sagubo. It's perfect for families, groups of friends, and solo travelers looking for an authentic outdoor experience in the mountains."
    },
    {
      id: 8,
      name: "Canuto's Dragon Fruit Farm",
      description: "A unique farm in Labueg where visitors can see and learn about dragon fruit cultivation.",
      image: "/assets/Canuto_s Dragon Fruit Farm (Labueg).jpg",
      location: "Labueg, Kapangan",
      barangay: "Labueg",
      category: "Gardens & Farms",
      contact: "Canuto's Farm: +63 918 567 8901",
      entranceFee: "₱50 per person (includes farm tour)",
      googleMapsLink: "https://maps.google.com/?q=Canuto+Dragon+Fruit+Farm+Labueg+Kapangan+Benguet",
      detailedDescription: "Canuto's Dragon Fruit Farm is a unique agricultural destination in Labueg that specializes in the cultivation of dragon fruit, a tropical fruit that thrives in the highland climate of Kapangan. This family-owned farm offers visitors an educational and interactive experience where they can learn about dragon fruit cultivation, from planting to harvesting. The farm features rows of dragon fruit cacti with their distinctive climbing stems and beautiful white flowers that bloom at night. Visitors can take guided tours to see the different varieties of dragon fruit grown on the farm, learn about the growing process, and even participate in harvesting activities during the fruiting season. The farm also offers fresh dragon fruit for sale and provides samples for tasting. It's an excellent destination for agricultural tourism, educational field trips, and anyone interested in learning about sustainable farming practices in the highlands."
    },
    {
      id: 9,
      name: "Dangwa Cave",
      description: "An intriguing cave formation in Taba-ao perfect for spelunking and cave exploration adventures.",
      image: "/assets/Dangwa Cave (Taba-ao).jpg",
      location: "Taba-ao, Kapangan",
      barangay: "Taba-ao",
      category: "Caves",
      contact: "Barangay Taba-ao Office: +63 918 345 6789",
      entranceFee: "₱75 per person (includes guide and safety equipment)",
      googleMapsLink: "https://maps.google.com/?q=Dangwa+Cave+Taba-ao+Kapangan+Benguet",
      detailedDescription: "Dangwa Cave is an impressive limestone cave system in Taba-ao that offers visitors an exciting spelunking adventure through its underground chambers and passages. This natural wonder features stunning stalactites and stalagmites formations that have been shaped over thousands of years by water erosion. The cave system includes multiple chambers of varying sizes, some with high ceilings and others requiring crawling through narrow passages. The cave is home to various bat species and other cave-dwelling creatures, making it an interesting destination for nature enthusiasts. Professional guides are required for cave exploration, and safety equipment including helmets and flashlights are provided. The cave is particularly popular during the dry season when the passages are more accessible. It's an ideal destination for adventure seekers, geology enthusiasts, and anyone looking for a unique underground experience in the mountains of Kapangan."
    },
    {
      id: 10,
      name: "Dumanay Cave",
      description: "A fascinating cave system in Pongayan offering unique geological formations and underground exploration.",
      image: "/assets/Dumanay Cave (Pongayan).jpg",
      location: "Pongayan, Kapangan",
      barangay: "Pongayan",
      category: "Caves",
      contact: "Barangay Pongayan Office: +63 919 456 7890",
      entranceFee: "₱80 per person (includes guide and safety equipment)",
      googleMapsLink: "https://maps.google.com/?q=Dumanay+Cave+Pongayan+Kapangan+Benguet",
      detailedDescription: "Dumanay Cave in Pongayan is a remarkable underground wonder that showcases some of the most unique geological formations in the Kapangan area. This extensive cave system features impressive limestone formations including flowstones, cave pearls, and intricate stalactite and stalagmite formations that create a magical underground landscape. The cave is known for its large chambers with high ceilings and its network of interconnected passages that offer different levels of difficulty for exploration. The cave's interior is adorned with natural sculptures formed by centuries of mineral deposits, creating an otherworldly atmosphere that's perfect for photography and exploration. Professional guides lead visitors through the cave, explaining the geological processes that created these formations and pointing out interesting features along the way. The cave is home to various cave-dwelling species and offers a unique opportunity to experience the underground ecosystem of the Cordillera mountains."
    },
    {
      id: 11,
      name: "Kilong Hanging Coffin",
      description: "A significant cultural heritage site in Central showcasing traditional burial practices of the Igorot people.",
      image: "/assets/Kilong Hanging Coffin (Central).jpg",
      location: "Central, Kapangan",
      barangay: "Central",
      category: "Cultural Heritage",
      contact: "Kapangan Tourism Office: +63 919 345 6789",
      entranceFee: "₱100 per person (includes guide)",
      googleMapsLink: "https://maps.google.com/?q=Kilong+Hanging+Coffin+Central+Kapangan+Benguet",
      detailedDescription: "The Kilong Hanging Coffin is one of the most significant cultural heritage sites in Kapangan, representing the ancient burial traditions of the Igorot people. These coffins, suspended high on cliff faces, showcase the unique funerary practices that have been passed down through generations. The hanging coffins are believed to bring the deceased closer to the spirits and protect them from wild animals. This sacred site offers visitors a profound glimpse into the rich cultural heritage of the Cordillera region. The area is maintained with great respect for the cultural significance, and visitors are encouraged to learn about the traditional beliefs and practices that continue to be honored by the local community today."
    },
    {
      id: 12,
      name: "Longog Cave",
      description: "An impressive cave system in Balakbak featuring stunning rock formations and underground chambers.",
      image: "/assets/Longog Cave (Balakbak).jpg",
      location: "Balakbak, Kapangan",
      barangay: "Balakbak",
      category: "Caves",
      contact: "Barangay Balakbak Office: +63 917 567 8901",
      entranceFee: "₱70 per person (includes guide and safety equipment)",
      googleMapsLink: "https://maps.google.com/?q=Longog+Cave+Balakbak+Kapangan+Benguet",
      detailedDescription: "Longog Cave in Balakbak is one of the most impressive cave systems in Kapangan, renowned for its spectacular rock formations and spacious underground chambers. This extensive cave network features towering stalactites and stalagmites that create a cathedral-like atmosphere in its main chambers. The cave is particularly famous for its unique rock formations that resemble various shapes and figures, sparking the imagination of visitors. The cave system includes multiple levels and chambers, some accessible through narrow passages and others through more open areas. The cave's acoustics are remarkable, with some chambers producing natural echoes that add to the mystical atmosphere. Professional guides lead visitors through the cave, sharing stories about the cave's formation and the local legends associated with it. The cave is also home to various bat species and other cave-dwelling creatures, making it an interesting destination for wildlife enthusiasts. It's an ideal destination for adventure seekers, geology enthusiasts, and anyone looking for a unique underground experience in the mountains."
    },
    {
      id: 13,
      name: "Malagyao Footbridge",
      description: "A charming footbridge in Cuba offering scenic views and a perfect spot for photography.",
      image: "/assets/Malagyao Footbridge (Cuba).jpg",
      location: "Cuba, Kapangan",
      barangay: "Cuba",
      category: "Infrastructure",
      contact: "Barangay Cuba Office: +63 918 234 5678",
      entranceFee: "Free",
      googleMapsLink: "https://maps.google.com/?q=Malagyao+Footbridge+Cuba+Kapangan+Benguet",
      detailedDescription: "The Malagyao Footbridge in Cuba is a charming wooden footbridge that spans across a scenic stream, offering visitors a perfect spot for photography and enjoying the natural beauty of the area. This traditional-style bridge is constructed using local materials and traditional building techniques, making it a beautiful example of local craftsmanship. The footbridge provides access to both sides of the stream and offers excellent views of the surrounding landscape, including the nearby mountains and vegetation. The area around the footbridge is particularly picturesque during different seasons, with the bridge serving as a focal point for landscape photography. The bridge is also a functional structure used by local residents for daily transportation, making it an authentic part of the local community. Visitors can walk across the bridge and enjoy the peaceful sounds of the flowing water below, making it an ideal spot for relaxation and contemplation. It's a perfect destination for photography enthusiasts, nature lovers, and anyone looking for a peaceful moment in the mountains."
    },
    {
      id: 14,
      name: "Mount Dakiwagan",
      description: "A majestic mountain peak in Balakbak offering challenging hiking trails and rewarding summit views.",
      image: "/assets/Mt. Dakiwagan (Balakbak).jpg",
      location: "Balakbak, Kapangan",
      barangay: "Balakbak",
      category: "Mountains & Hiking",
      contact: "Barangay Balakbak Office: +63 917 567 8901",
      entranceFee: "₱150 per person (includes guide and registration)",
      googleMapsLink: "https://maps.google.com/?q=Mount+Dakiwagan+Balakbak+Kapangan+Benguet",
      detailedDescription: "Mount Dakiwagan is one of the most challenging and rewarding hiking destinations in Kapangan, offering experienced hikers an opportunity to conquer a majestic peak with spectacular summit views. This mountain stands as one of the highest points in the area, providing panoramic views of the entire Kapangan municipality and the surrounding Cordillera mountain ranges. The hiking trail to the summit is challenging and requires good physical condition, with steep ascents, rocky terrain, and some technical sections that may require scrambling. The trail passes through diverse ecosystems including pine forests, grasslands, and rocky outcrops, offering hikers a variety of scenic landscapes. The summit provides breathtaking 360-degree views that are particularly stunning during sunrise and sunset. The hike typically takes 4-6 hours to reach the summit, depending on the hiker's pace and fitness level. Professional guides are recommended for safety, and proper hiking equipment including sturdy boots, warm clothing, and sufficient water is essential. It's an ideal destination for experienced hikers, mountain climbers, and adventure enthusiasts looking for a challenging outdoor experience."
    },
    {
      id: 15,
      name: "Mount Kalukasog",
      description: "A beautiful mountain in Cuba perfect for hiking and enjoying panoramic views of the surrounding area.",
      image: "/assets/Mt. Kalukasog (Cuba).jpg",
      location: "Cuba, Kapangan",
      barangay: "Cuba",
      category: "Mountains & Hiking",
      contact: "Barangay Cuba Office: +63 918 234 5678",
      entranceFee: "₱100 per person (includes guide)",
      googleMapsLink: "https://maps.google.com/?q=Mount+Kalukasog+Cuba+Kapangan+Benguet",
      detailedDescription: "Mount Kalukasog in Cuba is a beautiful and accessible mountain that offers hikers of all skill levels an opportunity to enjoy stunning panoramic views of the surrounding Kapangan landscape. This mountain features well-maintained hiking trails that wind through pine forests and open grasslands, providing a pleasant hiking experience with moderate difficulty. The trail to the summit is well-marked and takes approximately 2-3 hours to complete, making it suitable for families and beginner hikers. The summit offers spectacular 360-degree views of the Amburayan River valley, the surrounding mountain ranges, and the distant peaks of the Cordillera. The mountain is particularly beautiful during the early morning hours when the mist rises from the valleys below, creating a magical atmosphere. The area around Mount Kalukasog is also rich in biodiversity, with various bird species and native plants that can be observed along the trail. It's an ideal destination for nature lovers, photography enthusiasts, and anyone looking for a rewarding but not overly challenging hiking experience in the mountains of Kapangan."
    },
    {
      id: 16,
      name: "Kapangan Museum",
      description: "A cultural institution preserving the rich history and heritage of Kapangan and the Igorot people.",
      image: "/assets/Kapangan Museum.jpg",
      location: "Kapangan",
      barangay: "Central",
      category: "Cultural Heritage",
      contact: "Kapangan Museum: +63 919 345 6789",
      entranceFee: "₱50 per person",
      googleMapsLink: "https://maps.google.com/?q=Kapangan+Museum+Central+Kapangan+Benguet",
      detailedDescription: "The Kapangan Museum is a cultural treasure trove that preserves and showcases the rich history and heritage of Kapangan and the Igorot people. This important cultural institution houses an extensive collection of artifacts, photographs, documents, and traditional items that tell the story of the municipality's development and the unique culture of its people. The museum features exhibits on traditional Igorot practices, including agricultural methods, weaving techniques, and ceremonial traditions. Visitors can learn about the history of rice terrace farming, the significance of traditional clothing and accessories, and the evolution of local governance and community life. The museum also displays historical photographs and documents that chronicle important events in Kapangan's history, including the construction of infrastructure, cultural celebrations, and community milestones. Knowledgeable guides are available to provide detailed explanations of the exhibits and answer questions about local history and culture. The museum serves as an educational resource for students, researchers, and visitors interested in learning about the rich cultural heritage of the Cordillera region. It's an essential destination for anyone wanting to understand the deep cultural roots and traditions that continue to shape life in Kapangan today."
    },
    {
      id: 17,
      name: "Obellan-Catampan Rice Terraces",
      description: "Beautiful rice terraces in Balakbak showcasing the agricultural heritage and stunning mountain landscapes.",
      image: "/assets/Obellan-Catampan Rice Terraces (Balakbak).jpg",
      location: "Balakbak, Kapangan",
      barangay: "Balakbak",
      category: "Agricultural Heritage",
      contact: "Barangay Balakbak Office: +63 917 567 8901",
      entranceFee: "Free",
      googleMapsLink: "https://maps.google.com/?q=Obellan-Catampan+Rice+Terraces+Balakbak+Kapangan+Benguet",
      detailedDescription: "The Obellan-Catampan Rice Terraces in Balakbak represent one of the most beautiful examples of traditional Ifugao agricultural engineering in Kapangan. These magnificent terraces cascade down the mountainside in intricate patterns, creating a stunning landscape that showcases the incredible skill and dedication of the Igorot farmers who built them. The terraces follow the natural contours of the land, creating a stepped landscape that maximizes agricultural productivity while preserving the mountain ecosystem. The terraces are particularly beautiful during different seasons - during planting season, they are filled with water that reflects the sky and surrounding mountains, while during harvest season, they turn golden with ripening rice. The area offers excellent viewpoints for photography and sightseeing, with the terraces creating a dramatic backdrop against the mountain landscape. Visitors can learn about traditional rice farming methods, irrigation systems, and the cultural significance of rice cultivation in Igorot society. The terraces are still actively farmed using traditional methods, making them a living testament to the agricultural heritage of the Cordillera region. It's an ideal destination for photography enthusiasts, cultural tourists, and anyone interested in learning about traditional farming practices."
    },
    {
      id: 18,
      name: "Pey-og Falls",
      description: "A magnificent waterfall in Boklaoan offering a refreshing natural pool and scenic surroundings.",
      image: "/assets/Pey-og Falls (Boklaoan).jpg",
      location: "Boklaoan, Kapangan",
      barangay: "Boklaoan",
      category: "Waterfalls",
      contact: "Barangay Boklaoan Office: +63 918 678 9012",
      entranceFee: "₱60 per person",
      googleMapsLink: "https://maps.google.com/?q=Pey-og+Falls+Boklaoan+Kapangan+Benguet",
      detailedDescription: "Pey-og Falls in Boklaoan is a magnificent waterfall that cascades down rocky cliffs into a crystal-clear natural pool, creating a perfect spot for swimming and relaxation. This beautiful waterfall is surrounded by lush tropical vegetation and towering trees, providing a cool and refreshing atmosphere even during hot summer days. The falls feature multiple tiers with water cascading over smooth rock formations, creating a spectacular display of natural beauty. The natural pool at the base of the falls is deep enough for swimming and is fed by the cool mountain water, making it an ideal spot for a refreshing dip. The area around the falls is well-maintained with designated viewing areas and safe access paths. The sound of rushing water and the peaceful forest setting create a truly magical experience that's perfect for photography and quiet contemplation. The falls are particularly beautiful during the rainy season when the water flow is at its strongest, creating a more dramatic display. It's an ideal destination for nature lovers, swimming enthusiasts, and anyone looking for a peaceful escape into the natural beauty of the mountains."
    },
    {
      id: 19,
      name: "Puga Coffin Cave",
      description: "A historically significant cave in Sagubo containing ancient coffins and cultural artifacts.",
      image: "/assets/Puga Coffin Cave (Sagubo).jpg",
      location: "Sagubo, Kapangan",
      barangay: "Sagubo",
      category: "Cultural Heritage",
      contact: "Barangay Sagubo Office: +63 917 123 4567",
      entranceFee: "₱120 per person (includes guide and cultural briefing)",
      googleMapsLink: "https://maps.google.com/?q=Puga+Coffin+Cave+Sagubo+Kapangan+Benguet",
      detailedDescription: "Puga Coffin Cave in Sagubo is a historically significant archaeological site that contains ancient coffins and cultural artifacts dating back centuries. This sacred cave is one of the most important cultural heritage sites in Kapangan, offering visitors a profound glimpse into the ancient burial practices and cultural traditions of the Igorot people. The cave contains well-preserved wooden coffins that were traditionally placed in caves as part of the Igorot belief system, where the deceased were brought closer to the spirits and protected from wild animals. The coffins are intricately carved and decorated with traditional symbols and designs that reflect the cultural identity of the people who created them. The cave is maintained with great respect for its cultural significance, and visitors are required to follow strict protocols to preserve the site's sanctity. Knowledgeable guides provide detailed explanations about the cultural significance of the burial practices, the symbolism of the coffin designs, and the traditional beliefs associated with the site. The cave offers a unique opportunity to learn about the rich cultural heritage of the Cordillera region and the traditional practices that continue to be honored by the local community today."
    },
    {
      id: 20,
      name: "Taba-ao Viewdeck",
      description: "A panoramic viewing platform in Taba-ao offering breathtaking views of the surrounding mountains and valleys.",
      image: "/assets/Taba-ao Viewdeck (Taba-ao).jpg",
      location: "Taba-ao, Kapangan",
      barangay: "Taba-ao",
      category: "Viewing Areas",
      contact: "Barangay Taba-ao Office: +63 918 345 6789",
      entranceFee: "Free",
      googleMapsLink: "https://maps.google.com/?q=Taba-ao+Viewdeck+Taba-ao+Kapangan+Benguet",
      detailedDescription: "The Taba-ao Viewdeck is a spectacular panoramic viewing platform that offers visitors breathtaking 360-degree views of the surrounding mountains, valleys, and the Amburayan River below. This elevated platform is strategically located to provide unobstructed views of the entire Taba-ao area and beyond, making it one of the best viewpoints in Kapangan. The viewdeck features comfortable seating areas and safety railings, allowing visitors to relax and take in the magnificent scenery. The platform is particularly stunning during sunrise and sunset when the golden light illuminates the mountain ranges and creates dramatic shadows across the valleys. Visitors can see the intricate patterns of rice terraces, the winding Amburayan River, and the distant peaks of the Cordillera mountains. The viewdeck is easily accessible and features well-maintained pathways leading to the platform. It's a popular destination for photography enthusiasts, nature lovers, and anyone looking to appreciate the natural beauty of the Kapangan landscape. The area around the viewdeck also offers opportunities for bird watching and nature observation, making it an ideal destination for a peaceful retreat into the mountains."
    },
    {
      id: 21,
      name: "Toplac Falls",
      description: "A stunning waterfall in Pudong featuring cascading waters and natural beauty perfect for relaxation.",
      image: "/assets/Toplac Falls (Pudong).jpg",
      location: "Pudong, Kapangan",
      barangay: "Pudong",
      category: "Waterfalls",
      contact: "Barangay Pudong Office: +63 919 789 0123",
      entranceFee: "₱40 per person",
      googleMapsLink: "https://maps.google.com/?q=Toplac+Falls+Pudong+Kapangan+Benguet",
      detailedDescription: "Toplac Falls in Pudong is a stunning waterfall that features cascading waters over smooth rock formations, creating a beautiful natural display that's perfect for relaxation and photography. This picturesque waterfall is surrounded by lush tropical vegetation and towering trees, providing a cool and refreshing atmosphere that's ideal for escaping the heat. The falls cascade down multiple tiers, creating a series of small pools and cascades that add to the visual appeal. The natural pool at the base of the falls is perfect for swimming and wading, with crystal-clear water that's fed by the cool mountain streams. The area around the falls is well-maintained with designated viewing areas and safe access paths, making it accessible to visitors of all ages. The sound of rushing water and the peaceful forest setting create a truly magical experience that's perfect for quiet contemplation and nature appreciation. The falls are particularly beautiful during the rainy season when the water flow is at its strongest, creating a more dramatic and impressive display. It's an ideal destination for nature lovers, swimming enthusiasts, and anyone looking for a peaceful escape into the natural beauty of the mountains."
    },
    {
      id: 22,
      name: "Toplac Rice Fields",
      description: "Beautiful rice fields in Pudong showcasing traditional farming practices and scenic agricultural landscapes.",
      image: "/assets/Toplac Rice Fields (Pudong).jpg",
      location: "Pudong, Kapangan",
      barangay: "Pudong",
      category: "Agricultural Heritage",
      contact: "Barangay Pudong Office: +63 919 789 0123",
      entranceFee: "Free",
      googleMapsLink: "https://maps.google.com/?q=Toplac+Rice+Fields+Pudong+Kapangan+Benguet",
      detailedDescription: "The Toplac Rice Fields in Pudong represent a beautiful example of traditional rice farming in the highlands of Kapangan, showcasing the agricultural heritage and scenic beauty of the area. These well-maintained rice fields are cultivated using traditional methods that have been passed down through generations, creating a stunning landscape that changes with the seasons. During planting season, the fields are filled with water that reflects the sky and surrounding mountains, creating a mirror-like effect that's perfect for photography. During harvest season, the fields turn golden with ripening rice, creating a warm and inviting landscape. The rice fields are arranged in terraced patterns that follow the natural contours of the land, demonstrating the incredible skill and knowledge of the local farmers. Visitors can learn about traditional rice farming methods, irrigation systems, and the cultural significance of rice cultivation in Igorot society. The area offers excellent viewpoints for photography and sightseeing, with the rice fields creating a dramatic backdrop against the mountain landscape. It's an ideal destination for photography enthusiasts, cultural tourists, and anyone interested in learning about traditional farming practices and the agricultural heritage of the Cordillera region."
    }
  ];

  // Get unique barangays
  const barangays = ['all', ...Array.from(new Set(spots.map(spot => spot.barangay)))];

  // Filter spots based on selected barangay
  const filteredSpots = spots.filter(spot => {
    return selectedBarangay === 'all' || spot.barangay === selectedBarangay;
  });

  // Group spots by barangay for display
  const groupedSpots = filteredSpots.reduce((acc, spot) => {
    if (!acc[spot.barangay]) {
      acc[spot.barangay] = [];
    }
    acc[spot.barangay].push(spot);
    return acc;
  }, {} as Record<string, TouristSpot[]>);

  // Scroll to section when barangay is selected
  const scrollToSection = (barangay: string) => {
    if (barangay === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(`barangay-${barangay}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  useEffect(() => {
    if (selectedBarangay !== 'all') {
      scrollToSection(selectedBarangay);
    }
  }, [selectedBarangay]);

  const openDetails = (spot: TouristSpot) => {
    setSelectedSpot(spot);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setSelectedSpot(null);
    setShowDetails(false);
  };

  // If showing details, render the detail page
  if (showDetails && selectedSpot) {
    return (
      <div className="min-h-screen bg-egg-white">
        {/* Header with back button */}
        <div className="bg-light-green border-b border-border-green">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={closeDetails}
              className="flex items-center gap-2 text-primary-green hover:text-accent-green font-medium transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Tourist Spots
            </button>
          </div>
        </div>

        {/* Detail Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image and Info */}
            <div className="space-y-6">
              {/* Image */}
              <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={selectedSpot.image}
                  alt={selectedSpot.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* Basic Info */}
              <div className="bg-light-green rounded-lg p-6">
                <h1 className="text-3xl font-bold text-primary-green mb-4">{selectedSpot.name}</h1>
                
                <div className="space-y-4">
                  {/* Category Badge */}
                  <div>
                    <span className="bg-accent-green text-egg-white px-3 py-1 rounded-full text-sm font-medium">
                      {selectedSpot.category}
                    </span>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="font-semibold text-primary-green mb-1">Location</h3>
                    <p className="text-primary-green/70">{selectedSpot.location}</p>
                  </div>

                  {/* Barangay */}
                  <div>
                    <h3 className="font-semibold text-primary-green mb-1">Barangay</h3>
                    <p className="text-primary-green/70">{selectedSpot.barangay}</p>
                  </div>

                  {/* Contact */}
                  {selectedSpot.contact && (
                    <div>
                      <h3 className="font-semibold text-primary-green mb-1">Contact</h3>
                      <p className="text-primary-green/70">{selectedSpot.contact}</p>
                    </div>
                  )}

                  {/* Entrance Fee */}
                  {selectedSpot.entranceFee && (
                    <div>
                      <h3 className="font-semibold text-primary-green mb-1">Entrance Fee</h3>
                      <p className="text-primary-green/70 font-medium">{selectedSpot.entranceFee}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Description and Map */}
            <div className="space-y-6">
              {/* Description */}
              <div className="bg-egg-white border border-border-green rounded-lg p-6 shadow-md">
                <h2 className="text-2xl font-semibold text-primary-green mb-4">Description</h2>
                <p className="text-primary-green/70 leading-relaxed">
                  {selectedSpot.detailedDescription || selectedSpot.description}
                </p>
              </div>

              {/* Google Maps Embed */}
              {selectedSpot.googleMapsLink && (
                <div className="bg-egg-white border border-border-green rounded-lg p-6 shadow-md">
                  <h2 className="text-2xl font-semibold text-primary-green mb-4">Location Map</h2>
                  <div className="relative w-full h-96 rounded-lg overflow-hidden">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d122344.74121741697!2d120.51233228135519!3d16.613054265539382!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3391beeacea4804b%3A0x70049a733cf9916b!2sKapangan%2C%20Benguet!5e0!3m2!1sen!2sph!4v1758168375066!5m2!1sen!2sph"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Map of Kapangan, Benguet"
                    ></iframe>
                  </div>
                  <div className="mt-4">
                    <a
                      href={selectedSpot.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-accent-green hover:text-primary-green font-medium transition-colors duration-300"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-egg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-custom text-primary-green overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Mountains */}
          <div className="absolute top-10 left-10 animate-float">
            <svg width="80" height="60" viewBox="0 0 80 60" className="text-black/20">
              <path d="M0,60 L20,20 L40,40 L60,10 L80,30 L80,60 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute top-20 right-20 animate-drift">
            <svg width="100" height="70" viewBox="0 0 100 70" className="text-black/15">
              <path d="M0,70 L25,25 L50,45 L75,15 L100,35 L100,70 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute top-32 left-1/4 animate-float" style={{ animationDelay: '1s' }}>
            <svg width="60" height="50" viewBox="0 0 60 50" className="text-black/25">
              <path d="M0,50 L15,20 L30,35 L45,15 L60,25 L60,50 Z" fill="currentColor" />
            </svg>
          </div>

          {/* Rivers */}
          <div className="absolute bottom-20 left-0 right-0 animate-wave">
            <svg width="100%" height="40" viewBox="0 0 1200 40" className="text-black/10">
              <path d="M0,20 Q300,5 600,20 T1200,20 L1200,40 L0,40 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="absolute bottom-32 left-0 right-0 animate-wave" style={{ animationDelay: '1.5s' }}>
            <svg width="100%" height="30" viewBox="0 0 1200 30" className="text-black/15">
              <path d="M0,15 Q400,5 800,15 T1200,15 L1200,30 L0,30 Z" fill="currentColor" />
            </svg>
          </div>

          {/* Rice Terraces */}
          <div className="absolute bottom-40 right-10 animate-pulse-slow">
            <svg width="120" height="80" viewBox="0 0 120 80" className="text-black/20">
              <path d="M0,80 L0,60 L30,60 L30,40 L60,40 L60,20 L90,20 L90,0 L120,0 L120,80 Z" fill="currentColor" />
              <path d="M0,80 L0,70 L20,70 L20,50 L40,50 L40,30 L60,30 L60,10 L80,10 L80,0 L100,0 L100,80 Z" fill="currentColor" opacity="0.5" />
            </svg>
          </div>

          {/* Cave Entrance */}
          <div className="absolute top-40 right-1/3 animate-drift" style={{ animationDelay: '2s' }}>
            <svg width="60" height="40" viewBox="0 0 60 40" className="text-black/30">
              <ellipse cx="30" cy="20" rx="25" ry="15" fill="currentColor" />
              <ellipse cx="30" cy="20" rx="20" ry="10" fill="var(--gradient-end)" opacity="0.3" />
            </svg>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-green">
            Tourist Spots in Kapangan
          </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-primary-green/80">
            Discover the natural wonders and cultural heritage sites organized by barangay and category.
          </p>
          </div>
        </div>
        
        {/* Enhanced Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-16 text-black/20"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
              opacity=".3"
              fill="currentColor"
            />
            <path
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
              opacity=".4"
              fill="currentColor"
            />
            <path
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Filter Navigation */}
        <div className="mb-8">
          <div className="bg-light-green rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold text-primary-green mb-4">Barangay</h2>
            <div className="flex flex-wrap gap-2">
              {barangays.map((barangay) => (
                <button
                  key={barangay}
                  onClick={() => setSelectedBarangay(barangay)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedBarangay === barangay
                      ? 'bg-primary-green text-egg-white shadow-md scale-105'
                      : 'bg-egg-white text-primary-green border border-border-green hover:bg-accent-green hover:text-egg-white hover:scale-105'
                  }`}
                >
                  {barangay === 'all' ? 'All Barangays' : barangay}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-8 text-center">
          <p className="text-lg text-primary-green/80">
            Showing {filteredSpots.length} tourist spot{filteredSpots.length !== 1 ? 's' : ''}
            {selectedBarangay !== 'all' && ` in ${selectedBarangay}`}
          </p>
        </div>

        {/* Tourist Spots by Barangay */}
        {Object.keys(groupedSpots).length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedSpots).map(([barangay, spots]) => (
              <div key={barangay} id={`barangay-${barangay}`} className="scroll-mt-20">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-primary-green mb-2">
                    {barangay}
                  </h2>
                  <div className="h-1 w-20 bg-accent-green rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {spots.map((spot) => (
                    <div key={spot.id} className="bg-egg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-border-green hover:scale-105 group">
                      <div className="relative h-48 w-full">
                        <Image
                          src={spot.image}
                          alt={spot.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute top-2 right-2 bg-accent-green text-egg-white px-2 py-1 rounded-full text-xs font-medium">
                          {spot.category}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-primary-green mb-2 group-hover:text-accent-green transition-colors duration-300">
                          {spot.name}
                        </h3>
                        <p className="text-primary-green/70 mb-3 line-clamp-3">{spot.description}</p>
                        <p className="text-sm text-accent-green font-medium mb-4">{spot.location}</p>
                        <button
                          onClick={() => openDetails(spot)}
                          className="w-full bg-primary-green hover:bg-accent-green text-egg-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          View More
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-primary-green mb-2">No Results Found</h3>
            <p className="text-primary-green/70 mb-6">
              Try selecting a different barangay to see more tourist spots.
            </p>
            <button
              onClick={() => setSelectedBarangay('all')}
              className="bg-primary-green hover:bg-accent-green text-egg-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              Clear Filter
            </button>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-primary-green/80 mb-4">
            Explore these amazing tourist destinations in Kapangan, Benguet. Each location offers unique experiences and breathtaking natural beauty.
          </p>
          <button className="bg-primary-green hover:bg-accent-green text-egg-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
            Plan Your Visit
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary-green text-egg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-light-green mb-4">Kapangan Wonder</h3>
              <p className="text-light-green/80">
                Discover the natural beauty and cultural richness of Kapangan, Benguet.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/tourist-spots" className="text-light-green/80 hover:text-egg-white">Tourist Spots</Link></li>
                <li><Link href="/eat-and-stay" className="text-light-green/80 hover:text-egg-white">Eat & Stay</Link></li>
                <li><Link href="/blogs" className="text-light-green/80 hover:text-egg-white">Blogs</Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Help Center</Link></li>
                <li><Link href="/contact" className="text-light-green/80 hover:text-egg-white">Contact Us</Link></li>
                <li><Link href="/signin" className="text-light-green/80 hover:text-egg-white">Sign In</Link></li>
                <li><Link href="/signup" className="text-light-green/80 hover:text-egg-white">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📘</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">🐦</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📷</a>
                <a href="#" className="text-light-green/80 hover:text-egg-white text-2xl">📺</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border-green mt-8 pt-8 text-center text-light-green/80">
            <p>&copy; 2024 Kapangan Wonder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
