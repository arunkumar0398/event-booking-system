// Simple in-memory job queue implementation
class JobQueue {
  constructor() {
    this.jobs = [];
    this.isProcessing = false;
  }

  // Add job to queue
  add(jobName, data) {
    const job = {
      id: Date.now() + Math.random(),
      name: jobName,
      data,
      createdAt: new Date(),
      status: 'pending'
    };

    this.jobs.push(job);
    console.log(`[JOB QUEUE] Job added: ${jobName} (ID: ${job.id})`);

    // Process jobs asynchronously
    this.processJobs();

    return job;
  }

  // Process jobs in queue
  async processJobs() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.jobs.length > 0) {
      const job = this.jobs.shift();

      try {
        console.log(`[JOB QUEUE] Processing: ${job.name} (ID: ${job.id})`);

        // Simulate async processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        await this.executeJob(job);

        job.status = 'completed';
        console.log(`[JOB QUEUE] Completed: ${job.name} (ID: ${job.id})`);
      } catch (error) {
        job.status = 'failed';
        console.error(`[JOB QUEUE] Failed: ${job.name} (ID: ${job.id})`, error.message);
      }
    }

    this.isProcessing = false;
  }

  // Execute specific job type
  async executeJob(job) {
    switch (job.name) {
      case 'booking-confirmation':
        return this.sendBookingConfirmation(job.data);
      case 'event-update-notification':
        return this.sendEventUpdateNotification(job.data);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  // Booking confirmation job
  sendBookingConfirmation(data) {
    console.log('\n' + '='.repeat(60));
    console.log('BOOKING CONFIRMATION EMAIL');
    console.log('='.repeat(60));
    console.log(`To: ${data.customerEmail}`);
    console.log(`Subject: Booking Confirmation - ${data.eventTitle}`);
    console.log('-'.repeat(60));
    console.log(`Dear ${data.customerName},`);
    console.log('');
    console.log('Your booking has been confirmed!');
    console.log('');
    console.log(`Event: ${data.eventTitle}`);
    console.log(`Number of Tickets: ${data.numberOfTickets}`);
    console.log(`Total Amount: $${data.totalAmount}`);
    console.log(`Booking ID: ${data.bookingId}`);
    console.log(`Booking Date: ${new Date(data.bookingDate).toLocaleString()}`);
    console.log('');
    console.log('Thank you for booking with us!');
    console.log('='.repeat(60) + '\n');
  }

  // Event update notification job
  sendEventUpdateNotification(data) {
    console.log('\n' + '='.repeat(60));
    console.log('EVENT UPDATE NOTIFICATION');
    console.log('='.repeat(60));
    console.log(`Event: ${data.eventTitle}`);
    console.log(`Updated Fields: ${data.updatedFields.join(', ')}`);
    console.log('-'.repeat(60));
    console.log(`Notifying ${data.customers.length} customer(s):`);

    data.customers.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.name} (${customer.email})`);
    });

    console.log('-'.repeat(60));
    console.log('Message:');
    console.log(`The event "${data.eventTitle}" has been updated.`);
    console.log('Please check your booking for the latest details.');
    console.log('='.repeat(60) + '\n');
  }
}

// Singleton instance
const jobQueue = new JobQueue();

module.exports = jobQueue;
