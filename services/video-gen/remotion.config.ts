import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)

// Enable multi-process rendering on Linux for better performance in containers
Config.setChromiumMultiProcessOnLinux(true)
