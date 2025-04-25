async function displayApiData() {
  try {
    const response = await fetch('/fetch-api-data');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log('Data received from server:', data); // Check if data is correctly received in the browser console
    // Get the div element where we want to display the data
    const div = document.getElementById('ser-api-data') as HTMLDivElement;

    // Display the fetched API data as a string inside the div

    const divcontent = `<h3>Start: ${JSON.stringify(data.start, null, 2)}</h3>
     <h3>End: ${JSON.stringify(data.end, null, 2)}</h3>
     <h3>totalCount: ${JSON.stringify(data.totalCount, null, 2)}</h3>
     <h3>services: ${JSON.stringify(data.services, null, 2)}</h3>`;

    div.innerHTML = divcontent;
  } catch (error) {
    console.error('Error fetching API data:', error);
  }
}

window.onload = displayApiData;
