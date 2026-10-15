#!/usr/bin/env bash
# ==============================================================================
# Render Build Script for CineBook Django Backend
# ==============================================================================
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Upgrading pip and installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Collecting static assets for WhiteNoise..."
python manage.py collectstatic --no-input

echo "==> Applying database migrations..."
python manage.py migrate

echo "==> Populating / updating demo catalogue (idempotent seed_data)..."
python manage.py seed_data

echo "==> Build completed successfully!"
