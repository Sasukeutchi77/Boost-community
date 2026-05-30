import { db, missionsTable, achievementsTable, campaignsTable, usersTable } from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  // Missions
  const existingMissions = await db.select().from(missionsTable).limit(1);
  if (existingMissions.length === 0) {
    await db.insert(missionsTable).values([
      { title: "Regarde 3 vidéos", description: "Regarde 3 vidéos TikTok de nos partenaires jusqu'à la fin", type: "watch", coinsReward: 15, xpReward: 8, isDaily: true },
      { title: "Like 5 vidéos", description: "Like 5 vidéos de membres de la communauté", type: "like", coinsReward: 10, xpReward: 5, isDaily: true },
      { title: "Commente une vidéo", description: "Laisse un commentaire positif et constructif", type: "comment", coinsReward: 20, xpReward: 10, isDaily: false },
      { title: "Follow 3 créateurs", description: "Suis 3 nouveaux créateurs TikTok aujourd'hui", type: "follow", coinsReward: 25, xpReward: 12, isDaily: true },
      { title: "Partage une vidéo", description: "Partage une vidéo depuis TikTok vers tes réseaux", type: "share", coinsReward: 30, xpReward: 15, isDaily: false },
      { title: "10 Likes en 1 jour", description: "Like 10 vidéos différentes dans la journée", type: "like", coinsReward: 50, xpReward: 25, isDaily: true },
      { title: "Regarde 10 vidéos", description: "Regarde 10 vidéos complètes sans zapper", type: "watch", coinsReward: 40, xpReward: 20, isDaily: false },
      { title: "Commente 5 vidéos", description: "Ecris 5 commentaires détaillés et engageants", type: "comment", coinsReward: 75, xpReward: 35, isDaily: false },
      { title: "Follow 10 créateurs", description: "Suis 10 créateurs de la communauté", type: "follow", coinsReward: 80, xpReward: 40, isDaily: false },
      { title: "Partage 3 vidéos", description: "Partage 3 vidéos sur tes stories ou DM", type: "share", coinsReward: 90, xpReward: 45, isDaily: false },
    ]);
    console.log("✓ Missions seeded");
  } else {
    console.log("  Missions already seeded, skipping");
  }

  // Achievements
  const existingAchievements = await db.select().from(achievementsTable).limit(1);
  if (existingAchievements.length === 0) {
    await db.insert(achievementsTable).values([
      { title: "Premier pas", description: "Complète ta première mission", category: "missions", requirement: 1, rewardCoins: 50 },
      { title: "Missionnaire", description: "Complète 10 missions", category: "missions", requirement: 10, rewardCoins: 200 },
      { title: "Expert des missions", description: "Complète 50 missions", category: "missions", requirement: 50, rewardCoins: 500 },
      { title: "Créateur actif", description: "Maintiens un streak de 7 jours", category: "streak", requirement: 7, rewardCoins: 150 },
      { title: "Régulier", description: "Maintiens un streak de 30 jours", category: "streak", requirement: 30, rewardCoins: 500 },
      { title: "Riche en coins", description: "Gagne 500 coins", category: "coins", requirement: 500, rewardCoins: 100 },
      { title: "Millionnaire", description: "Gagne 5000 coins", category: "coins", requirement: 5000, rewardCoins: 500 },
      { title: "Lanceur de campagne", description: "Lance ta première campagne", category: "campaigns", requirement: 1, rewardCoins: 100 },
      { title: "Ambassadeur", description: "Parraine 1 ami", category: "referral", requirement: 1, rewardCoins: 200 },
    ]);
    console.log("✓ Achievements seeded");
  } else {
    console.log("  Achievements already seeded, skipping");
  }

  // Demo campaigns — only if at least one user exists
  const ownerUser = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  if (ownerUser.length > 0) {
    const existingCampaigns = await db.select().from(campaignsTable).limit(1);
    if (existingCampaigns.length === 0) {
      await db.insert(campaignsTable).values([
        { ownerId: 1, title: "Boost mes likes TikTok", description: "J'ai besoin de likes sur mes dernières vidéos", targetType: "like", targetCount: 500, coinsRequired: 5, status: "active" },
        { ownerId: 1, title: "Gagne des followers", description: "Rejoins ma communauté TikTok gaming", targetType: "follow", targetCount: 200, coinsRequired: 8, status: "active" },
        { ownerId: 1, title: "Vues vidéo cuisine", description: "Regarde mes recettes et donne ton avis", targetType: "watch", targetCount: 1000, coinsRequired: 3, status: "active" },
      ]);
      console.log("✓ Demo campaigns seeded");
    } else {
      console.log("  Campaigns already seeded, skipping");
    }
  } else {
    console.log("  No user with ID 1 found, skipping demo campaigns");
  }

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
