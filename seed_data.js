import { db } from './src/firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const sampleProjects = [
    {
        title: "E-Commerce Dashboard",
        description: "A comprehensive dashboard for managing online store inventory and orders. Features real-time analytics and user management.",
        techStack: ["React", "Redux", "Material UI", "Firebase"],
        githubUrl: "https://github.com/username/ecommerce-dashboard",
        liveUrl: "https://ecommerce-demo.web.app",
        imageUrl: "https://via.placeholder.com/400x250/6c63ff/ffffff?text=E-Commerce+Dashboard"
    },
    {
        title: "Weather App Pro",
        description: "Real-time weather application with location tracking and 7-day forecast. Uses OpenWeatherMap API.",
        techStack: ["JavaScript", "HTML5", "CSS3", "API"],
        githubUrl: "https://github.com/username/weather-app",
        liveUrl: "https://weather-pro.netlify.app",
        imageUrl: "https://via.placeholder.com/400x250/ff6584/ffffff?text=Weather+App"
    },
    {
        title: "Task Manager",
        description: "Collaborative task management tool with drag-and-drop interface and team assignments.",
        techStack: ["React", "Node.js", "MongoDB", "Socket.io"],
        githubUrl: "https://github.com/username/task-manager",
        liveUrl: "https://task-manager-demo.herokuapp.com",
        imageUrl: "https://via.placeholder.com/400x250/3f3d56/ffffff?text=Task+Manager"
    }
];

async function seedDatabase() {
    try {
        const projectsCollection = collection(db, "projects");

        console.log("Starting to seed database...");

        for (const project of sampleProjects) {
            await addDoc(projectsCollection, {
                ...project,
                createdAt: serverTimestamp()
            });
            console.log(`Added project: ${project.title}`);
        }

        console.log("Database seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
}

// We cannot run this script directly with node because it uses ES modules and imports from src/firebase.js which might rely on browser APIs or specific bundler setup.
// Instead, we will create a temporary component to run this logic once when the app loads, or we can instruct the user to use the UI.
// Since the environment is already set up for React, let's create a temporary button in the Admin page to "Seed Data".

console.log("This script is intended to be integrated into the app for execution.");
