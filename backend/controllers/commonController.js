const { db } = require('../config/dbConfig');
const logger = require('../utils/logger');

// API Endpoint to handle form submission
const handleFormSubmission = async (req, res) => {

    if (req.body == null || req.body.sessionId == null) {
        logger.error(`The request body for handleFormSubmission has an issue - ${JSON.stringify(req.body)}`);
        return res.status(500).send('Error processing request');
    }

    try {
        const contactusfields = req.body.contactus;

        logger.info(`request body for CONTACT US Page ${JSON.stringify(req.body)}`);

        if (!contactusfields.name || !contactusfields.email || !contactusfields.message) {
            // Respond with an error if any of the fields are missing
            return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
        }

        // Here, you could implement additional logic such as:
        // Prepare data to be saved
        const formData = { full_name: contactusfields.name, email: contactusfields.email, Message: contactusfields.message, message_date: new Date() };

        // Insert form data into MongoDB collection
        db.collection('contacts').insertOne(formData)
            .then(result => {
                console.log(`New contact inserted with ID: ${result.insertedId}`);
                res.json({ success: true, message: 'Your message has been received. Thank you!' });
            })
            .catch(error => {
                console.error('Error inserting data into MongoDB:', error);
                res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
            });

        // For demonstration, we'll just log the received data
        console.log(`Received contact form submission:\nName: ${contactusfields.name}\nEmail: ${contactusfields.email}\nMessage: ${contactusfields.message}`);

        // Respond with a success message
        res.json({ success: true, message: 'Your message has been received. Thank you!' });

    } catch (error) {
        logger.error(`handleFormSubmission error - ${ JSON.stringify(error.message) } - ${ JSON.stringify(error.stack) }`);
        res.status(500).send('Error processing request');
    }
};

module.exports = {
    handleFormSubmission
};