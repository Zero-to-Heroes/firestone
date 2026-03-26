## Axe 1 : Système d'intelligence contextuelle avancé - Pools dynamiques, oracles et highlights

**Versions concernées :** Toutes les versions 2025 (effort continu et massif)

**Description :**
Développement et enrichissement d'un système multi-couches d'aide à la décision contextuelle :

1. **Pools dynamiques** : Lorsque le joueur survole une carte, le système calcule en temps réel la liste des cartes pouvant être générées/découvertes, en tenant compte du format de jeu, des cartes déjà jouées, du mana disponible, des tribus présentes dans le lobby, et du contexte (Arena/Constructed/Tavern Brawl). Exemple : survol d'une Larva dans la main adverse affiche les minions possibles selon le contexte.
2. **Oracles** : Détection et affichage d'informations sur les cartes cachées dans la main de l'adversaire (cartes créées, copiées, découvertes, tutored). Innovation 2025 : différenciation fine entre cartes piochées et cartes créées dans la main adverse (v16.2.1), avec pools dynamiques distincts pour chaque occurrence.
3. **Highlights** : Mise en surbrillance contextuelle des synergies entre cartes. Innovation 2025 : highlights croisés (cartes Imbue, Starship, Excavate, Concoction, Riff s'inter-highlightent), reverse highlights (survol d'un sort de feu highlight les cartes qui interagissent avec les sorts de feu), highlights conditionnels (dommages de sort highlight Eversong Portal).
4. **Cartes liées** : Nouveau mécanisme (v15.25.0) permettant de tracker les copies d'une même carte et de révéler les informations lors de la mise en jeu d'une copie.

**Verrous technologiques :**

- Modélisation d'un graphe de relations entre centaines de cartes avec des règles contextuelles complexes
- Mise à jour en temps réel du graphe en fonction des actions de jeu
- Prévention des fuites d'information (information leak) tout en maximisant les données utiles au joueur

---

## Axe 2 : Système de compositions Battlegrounds avec scoring et identification automatique

**Versions concernées :** 15.10.0 (Mai), 15.15.4 (Juin), 15.16.2 (Juil), 15.19.1 (Juil), 15.24.0 (Sep), 15.26.9 (Oct)

**Description :**
Création d'un système complet d'analyse des compositions (builds) en Battlegrounds :

- **Tab Compositions** dans l'application principale avec les builds méta, triés par puissance
- **Scoring numérique ("Power stat")** : algorithme propriétaire assignant une valeur numérique à la force de chaque composition, basé sur l'analyse de données agrégées (détails : https://github.com/Zero-to-Heroes/firestone/wiki/Battlegrounds-Compositions-Power-stat)
- **Identification automatique de composition** en cours de partie et dans les replays (v15.19.1) : le système analyse le plateau du joueur et le classe automatiquement dans un archétype
- **Highlight en temps réel** : les cartes possédées (plateau/main/shop) sont mises en surbrillance par rapport à la composition ciblée
- **Tips d'experts** : intégration de guides écrits par des joueurs classés top 1 leaderboard
- **Compositions Stats tab** (v15.24.0) : statistiques agrégées de performance par composition et par rang
- **Support des Trinkets** dans les compositions (v15.10.7)

**Verrous technologiques :**

- Algorithme de classification/identification automatique de composition à partir d'un état de plateau partiel
- Calcul d'un score de puissance représentatif à partir de données hétérogènes
- Mise à jour dynamique à chaque patch méta

---

## Axe 3 : Système de compteurs intelligents avec positionnement et affichage adaptatifs

**Versions concernées :** 15.1.0 (Mar), 15.2.5 (Avr), 15.6.0 (Avr), 15.10.7 (Mai), 15.11.1 (Mai), 16.4.5 (Nov), 16.6.2 (Déc)

**Description :**
Refonte architecturale du système de compteurs (widgets overlay affichant des métriques en temps réel) :

- **Nouveau système de positionnement par index** (v15.1.0) : les positions sont mémorisées par rang de compteur et non par identité, résolvant le problème de repositionnement constant
- **Mode compact** (v15.11.1) : affichage de tous les compteurs sous forme de liste compacte
- **Réglage global d'opacité** (v15.10.7) avec retour à l'opacité pleine au survol
- **Section "Current Effects"** (v16.4.5) : nouveau widget trackant les effets en cours (enchantements, auras) en temps réel, complémentaire aux compteurs et aux effets globaux
- **Activation conditionnelle intelligente** : chaque compteur s'affiche selon des règles contextuelles (classe de l'adversaire, cartes jouées, mode de jeu, pool de cartes valide). En v16.6.2 : les compteurs ne s'affichent plus si la carte associée n'est pas dans le pool du mode de jeu
- Création de dizaines de nouveaux compteurs spécifiques (Imbue, Protoss, Starship, Colossus, Dark Gifts, Corpses, APM, Elementals Tavern Buff, Undead Army, Deep Blues, Volumizer, etc.)
- **Compteur APM** (v15.26.9) pour les Battlegrounds : mesure les actions par minute avec APM moyen et pic

**Verrous technologiques :**

- Système de règles d'activation contextuel gérant des centaines de conditions croisées
- UI overlay performante avec positionnement dynamique sans impact sur les performances de jeu
- Gestion de l'état complexe des compteurs entre parties, modes et reconnexions

---

## Axe 4 : Support du mode Arena Underground et enrichissement des outils Arena

**Versions concernées :** 15.4.2 (Avr), 15.12.15 (Juin), 15.13.0 (Juin), 15.13.2 (Juin), 15.13.4 (Juin), 15.15.4 (Juin), 15.16.2 (Juil), 15.22.1 (Août), 15.26.9 (Oct)

**Description :**
Adaptation complète de l'application au nouveau mode Arena Underground introduit par Blizzard, et enrichissement des fonctionnalités Arena :

- **Support intégral d'Arena Underground** (v15.12.15) : détection du mode, statistiques de cartes pendant le pick ET le redraft, affichage des stats pour les packages de Légendaires
- **Widget Season Recap** (v15.4.2) : widget overlay affichant un récap de la saison Arena en cours, configurable par timeframe, avec gestion des modes multiples et interactions avancées (Shift pour figer la liste)
- **Stats avancées de cartes** : pick rate, deck impact, kept%, stats de découverte spécifiques au mode, distinction entre pool de draft et pool de découverte in-game
- **Reverse synergies** (v15.26.9) : pendant le draft, survol d'un sort highlight les cartes qui bénéficient des sorts
- **Affichage des cartes en cours de draft** dans le tracker (v15.26.9) pour faciliter l'accès aux pools dynamiques
- **Gestion du redraft** : statistiques affichées pendant le nettoyage du deck, option pour n'afficher les stats supplémentaires que pendant le retrait de cartes
- Filtrage par mode de jeu dans toutes les statistiques personnelles

**Verrous technologiques :**

- Reverse-engineering du nouveau mode de jeu Arena Underground à partir des logs de jeu
- Gestion de pools de cartes distincts (draft vs discover vs redraft) avec mises à jour en temps réel
- Calcul de synergies inverses à partir du graphe de relations entre cartes

---

## Axe 5 : Refonte du lecteur de replays avec navigation événementielle

**Versions concernées :** 15.14.0 (Juin)

**Description :**
Refonte majeure de l'expérience de visionnage des replays :

- **Journal d'événements simplifié** : affichage d'une timeline cliquable résumant les actions significatives de la partie. Un clic sur un événement transporte directement au moment correspondant. Le journal affiche des actions différentes selon le mode (BG vs Constructed)
- **Navigation intelligente** : certaines actions sont automatiquement sautées lors de la navigation (animations, transitions), avec possibilité de revenir au pas-à-pas détaillé (Shift + flèches)
- **Affichage des decklists** à côté du replay pour les modes non-BG
- **Affichage "big card"** pour toutes les cartes jouées (pas seulement les sorts)
- **Lien de visionnage en ligne** directement depuis la liste des replays

**Verrous technologiques :**

- Extraction d'événements significatifs à partir du flux brut d'actions de jeu
- Synchronisation du viewer avec l'état de jeu à n'importe quel point de la timeline
- Différenciation intelligente des modes de jeu pour adapter le journal d'événements

---

## Axe 6 : Système de gestion de mods avec installation sécurisée

**Versions concernées :** 16.0.6 (Oct), 16.5.0 (Nov)

**Description :**
Création d'un écosystème de mods pour Hearthstone, géré depuis Firestone :

- **Plateforme de gestion de mods** : interface permettant d'installer, activer/désactiver et mettre à jour des modifications tierces du jeu
- **Installation en un clic** (v16.5.0) pour les mods vérifiés (Auto-Squelch, Golden Buddy Tooltip, Show Exact Collection Count)
- **Processus de revue de sécurité** : seuls les mods personnellement vérifiés par le développeur sont proposés en installation directe
- Documentation publique des mods disponibles et de leur statut de vérification

**Verrous technologiques :**

- Injection de modifications dans un processus tiers (client Hearthstone) de manière fiable et réversible
- Système de distribution et de mise à jour de mods avec vérification d'intégrité
- Gestion du cycle de vie des mods (installation, activation, désactivation, mise à jour, suppression)
