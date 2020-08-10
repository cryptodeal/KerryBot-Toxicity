# KerryBot-Toxicity

## KerryBot-Toxicity Functionality
* Use TensorFlow.JS for natural language toxicity analysis
* Pulls new posts/comments from Chapo.Chat
  * Posts - parses title and body for toxic language
  * Comments - parses content of comment for toxic content
* Connects to Chapo.Chat websocket API and upvotes toxic content

## Strategy
* Bot starts by pulling 20 recent posts and comments
* Bot passes each the body/title of each post and content of each comment to the tensorflow model
* TensorFlow utilizes natural language machine learning and a text sentiment model (trained to identify 7 types of toxic content)
* TensorFlow looks for the index of 'true' in the array of predictions and returns either -1 (not found) or the position of the index in the array where the content has been flagged as toxic
* Results that do not have a value of -1 returned are passed to the likePost or likeComment function
* The bot then maps the array of users provided to it, upvoting the post/comment from each user
* Results are logged in the terminal as well as random info as the bot runs (e.g. User # X liked Post # Y)
* Bot repeats this loop on a 3 minute interval

## To-Do
* Cache posts so that multiple groups of users can access the cached data and upvote accordingly
* Change the proxy that the bot is connected to at the start of each loop (anonymize the IP address the bot is run from)
  * This will be coupled with the groupings of users so that the traffic looks more authentic vs a wave of upvotes/downvotes

## Installation
* Clone the repository to your local device
* Verify that you have node.js and npm installed
* Navigate to the root directory of the project and run:
  npm install
* Note: you might want to look into tensorflow for node.js installation as it can be optimized to use your GPU for a processing boost
* To run the bot, run:
  node index.js




