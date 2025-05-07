// js/news.js

document.addEventListener("DOMContentLoaded", function () {
    fetch('../news/posts.json')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('blog-cards');
            data.forEach(blog => {
                const card = `
                    <div class="col-lg-4" style="padding-bottom: 50px">
                        <div class="card h-100">
                            <img src="${blog.image}" class="card-img-top" alt="${blog.title}">
                            <div class="card-body">
                                <h4 class="card-title text-dark card-heading">${blog.title}</h4>
                                <p class="card-text text-dark subtext">${blog.description}</p>
                                <a href="${blog.link}" class="btn btn-outline-dark news-readmore-btn">Read More</a>
                            </div>
                            <div class="card-footer">
                                <small class="text-muted">
                                ${new Date(blog.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </small>
                            </div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', card);
            });
        })
        .catch(err => {
            console.error('Failed to load blog posts:', err);
            document.getElementById('blog-cards').innerHTML = '<p style="margin-left:1rem" class="text-danger">Unable to load blog posts at this time.</p>';
        });
});
