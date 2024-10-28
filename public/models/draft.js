document.addEventListener('DOMContentLoaded', function () {
    const draftSettings = JSON.parse(localStorage.getItem('draftSettings'));
    const draftOrder = document.getElementById('draft-order');
    const playerList = document.getElementById('player-list');
    const rosterList = document.getElementById('roster-list');
    const positionFilter = document.getElementById('position-filter');

    let players = [];
    let teams = [];

    // Initialize draft
    function initializeDraft() {
        // Create teams
        for (let i = 1; i <= draftSettings.num_teams; i++) {
            teams.push({ name: `Team ${i}`, roster: [] });
        }

        // Display draft order
        displayDraftOrder();

        // Fetch players
        fetchPlayers();

        // Set up event listeners
        positionFilter.addEventListener('change', filterPlayers);
    }

    // Display draft order
    function displayDraftOrder() {
        draftOrder.innerHTML = '';
        for (let i = 0; i < draftSettings.num_rounds; i++) {
            const round = document.createElement('div');
            round.classList.add('draft-round');
            round.innerHTML = `<h3>Round ${i + 1}</h3>`;
            const picks = document.createElement('ol');
            for (let j = 0; j < teams.length; j++) {
                const pick = document.createElement('li');
                // Alternate draft order each round
                pick.textContent = teams[i % 2 === 0 ? j : teams.length - 1 - j].name;
                picks.appendChild(pick);
            }
            round.appendChild(picks);
            draftOrder.appendChild(round);
        }
    }


    // Fetch players from JSON file
    async function fetchPlayers() {
        try {
            const response = await fetch('http://localhost:3000/api/players');  // Full URL to the server
            const data = await response.json();
            console.log(data); // Log to ensure the data is correct
            players = data.players;
            displayPlayers();
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    }


    // Display players
    function displayPlayers(filteredPlayers = players) {
        playerList.innerHTML = '';
        filteredPlayers.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.classList.add('player-card');

            // Use player name for the image file
            const playerImageName = player.name.replace(/\s+/g, '-') + '.png';

            playerCard.innerHTML = `
        <div class="player-info">
            <img src="../images/${playerImageName}" alt="${player.name}" class="player-image-large">
            <div class="player-details">
                <h4>${player.name}</h4>
                <p class="player-position ${player.position}">${player.position} | ${player.team} | Bye ${player.byeWeek}</p>
                <p>Projected Points: ${player.projectedPoints.ppr} (PPR)</p>
            </div>
        </div>
        <div class="draft-button-container">
            <button class="draft-button">Draft</button>
        </div>
    `;

            playerCard.querySelector('.draft-button').addEventListener('click', () => draftPlayer(player));
            playerList.appendChild(playerCard);
        });
    }


    // Filter players by position
    function filterPlayers() {
        const position = positionFilter.value;
        const filteredPlayers = position === 'ALL' ? players : players.filter(p => p.position === position);
        displayPlayers(filteredPlayers);
    }

    // Draft a player
    function draftPlayer(player) {
        const currentTeam = teams[0];  // Assume it's always the user's turn for simplicity
        currentTeam.roster.push(player);
        players = players.filter(p => p.id !== player.id);

        // Mark player as drafted
        displayPlayers();
        displayRosters();

        // Automatically draft players for other teams
        for (let i = 1; i < teams.length; i++) {
            autoDraft(teams[i]);
        }
    }

    function autoDraft(team) {
        if (players.length === 0) return; // Stop if no players left
        const bestPlayer = players.shift(); // Pick the highest-ranked player
        team.roster.push(bestPlayer);
        displayPlayers();
        displayRosters();
    }



    // Display team rosters
    function displayRosters() {
        rosterList.innerHTML = '';
        teams.forEach(team => {
            const teamDiv = document.createElement('div');
            teamDiv.innerHTML = `<h3>${team.name}</h3>`;
            const rosterUl = document.createElement('ul');

            // Categorize players by position
            const groupedPlayers = groupPlayersByPosition(team.roster);
            Object.keys(groupedPlayers).forEach(position => {
                const positionLi = document.createElement('li');
                positionLi.innerHTML = `<strong>${position}:</strong> ${groupedPlayers[position].map(p => p.name).join(', ')}`;
                rosterUl.appendChild(positionLi);
            });

            teamDiv.appendChild(rosterUl);
            rosterList.appendChild(teamDiv);
        });
    }

    // Helper function to group players by position
    function groupPlayersByPosition(roster) {
        return roster.reduce((acc, player) => {
            if (!acc[player.position]) {
                acc[player.position] = [];
            }
            acc[player.position].push(player);
            return acc;
        }, {});
    }


    initializeDraft();
});

