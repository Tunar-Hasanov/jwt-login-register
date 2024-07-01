document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      window.location.href = '/';
      return;
    }
  
    const response = await fetch('/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  
    const data = await response.json();
    if (response.ok) {
      document.getElementById('profileInfo').innerText = `Welcome, ${data.data.email}`;
    } else {
      alert(data.message);
      localStorage.removeItem('token');
      window.location.href = '/';
    }
  });
  