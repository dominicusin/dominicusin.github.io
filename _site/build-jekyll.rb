#!/usr/bin/env ruby

# Simple Jekyll build script that doesn't rely on bundler
require 'fileutils'

puts "Building Jekyll site..."

# Define source and destination directories
source_dir = File.dirname(__FILE__)
dest_dir = File.join(source_dir, "_site")

# Clean destination directory
if File.exist?(dest_dir)
  puts "Cleaning existing site..."
  FileUtils.rm_rf(dest_dir)
end

# Run jekyll build command
jekyll_command = "jekyll build --config _config.yml"
puts "Running: #{jekyll_command}"
system(jekyll_command)

puts "Build completed!"
puts "Site built in: #{dest_dir}"