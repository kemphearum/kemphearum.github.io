# Solution Architecture

## Overview

The solution is a React Router 7 SSR application built with Vite. Vercel hosts the primary SSR/API runtime, Firebase provides Authentication and Firestore, and static mirrors are supported through Firebase Hosting and GitHub Pages.

## Core Flow

Public routes render pages and sections. Those pages read content through services and domain normalizers. Admin routes authenticate users, evaluate permissions, render registry-driven modules, and persist changes through services into Firestore.

## Constraints

Preserve zero-cost deployment, avoid paid Firebase services, and keep source layering intact.

