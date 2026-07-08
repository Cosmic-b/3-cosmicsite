fetch('./data/data.json')
    .then(res => {
        console.log(res.status);
        console.log(res.ok);
        return res.json();
    })
    .then(data => {
        const projectList = document.getElementById('project-list');
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'project-preview'
            div.innerHTML = `
            <img class='thumbnail' src='${item['thumb-src']}'>
            <h4>${item.name}</h4>
            `;
            projectList.appendChild(div)
        });
    })
