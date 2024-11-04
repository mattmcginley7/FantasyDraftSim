document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('draft-settings-form');
    const numTeamsSelect = document.getElementById('num-teams');
    const userPickSelect = document.getElementById('user-pick');

    // Populate user pick options based on number of teams
    function updateUserPickOptions() {
        const numTeams = parseInt(numTeamsSelect.value);
        userPickSelect.innerHTML = '';
        for (let i = 1; i <= numTeams; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            userPickSelect.appendChild(option);
        }
    }

    numTeamsSelect.addEventListener('change', updateUserPickOptions);
    updateUserPickOptions(); // Initial population

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(form);
        const draftSettings = Object.fromEntries(formData.entries());

        // Validate form data
        let isValid = true;

        // Check number of rounds
        if (parseInt(draftSettings.num_rounds) < 9 || parseInt(draftSettings.num_rounds) > 18) {
            alert('Number of rounds must be between 9 and 18.');
            isValid = false;
        }

        // Calculate total starting positions
        const totalStartingPositions = ['qb', 'rb', 'wr', 'te', 'flex', 'superflex', 'dst', 'k']
            .reduce((sum, pos) => sum + parseInt(draftSettings[pos] || 0), 0);

        if (totalStartingPositions > parseInt(draftSettings.num_rounds)) {
            alert('Total starting positions cannot exceed the number of draft rounds.');
            isValid = false;
        }

        // If all validations pass, save settings and redirect
        if (isValid) {
            localStorage.setItem('draftSettings', JSON.stringify(draftSettings));
            window.location.href = 'draft.html';
        }
    });
});
