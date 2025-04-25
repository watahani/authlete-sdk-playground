async function displayApiData() {
  try {
    const response = await fetch('/fetch-api-data');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log('Data received from server:', data); // Check if data is correctly received in the browser console
    // Get the div element where we want to display the data
    const div = document.getElementById('api-data') as HTMLDivElement;

    // Display the fetched API data as a string inside the div
    if (data && data.clients && Array.isArray(data.clients) && data.clients.length > 0) {
    // If clients is an array and has data, iterate over it
    console.log("Clients array:", data.clients);
    data.clients.forEach((client, index) => {
      console.log(`Client ${index + 1}:`, client);
      div.innerHTML = `<pre>${JSON.stringify(client, null, 2)}</pre>`;
    });
  } else {
    // If clients is null or empty, display a message
    console.log("No clients available or clients data is null.");
  }
    const divcontent = `<h3>Start: ${JSON.stringify(data.start, null, 2)}</h3>
     <h3>End: ${JSON.stringify(data.end, null, 2)}</h3>
     <h3>developer: ${JSON.stringify(data.developer, null, 2)}</h3>
     <h3>totalCount: ${JSON.stringify(data.totalCount, null, 2)}</h3>
     <h3>clients: ${JSON.stringify(data.clients, null, 2)}</h3>`;
    div.innerHTML = divcontent;
  } catch (error) {
    console.error('Error fetching API data:', error);
  }
}

window.onload = displayApiData;
