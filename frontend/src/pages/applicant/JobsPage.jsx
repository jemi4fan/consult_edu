import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import {
  Briefcase,
  Search,
  Filter,
  Eye,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Building,
} from 'lucide-react';

const ApplicantJobsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Mock data - replace with actual API calls
  const jobs = [
    {
      id: 1,
      name: 'Software Engineer',
      country: 'United States',
      positions: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer'],
      fee: 0,
      status: 'published',
      deadline: '2024-03-15',
      description: 'We are looking for talented software engineers to join our team.',
      requirements: {
        experience: '2+ years',
        education: 'Bachelor\'s degree in Computer Science',
        skills: ['JavaScript', 'React', 'Node.js'],
      },
      company: 'Google',
      applications_count: 45,
      isApplied: false,
    },
    {
      id: 2,
      name: 'Data Scientist',
      country: 'Canada',
      positions: ['Senior Data Scientist', 'Junior Data Scientist'],
      fee: 50,
      status: 'published',
      deadline: '2024-02-28',
      description: 'Join our data science team and work on exciting machine learning projects.',
      requirements: {
        experience: '3+ years',
        education: 'Master\'s degree in Data Science or related field',
        skills: ['Python', 'Machine Learning', 'Statistics'],
      },
      company: 'Microsoft',
      applications_count: 23,
      isApplied: true,
    },
    {
      id: 3,
      name: 'Product Manager',
      country: 'United Kingdom',
      positions: ['Product Manager'],
      fee: 25,
      status: 'published',
      deadline: '2024-04-01',
      description: 'Lead product development and strategy for our innovative platform.',
      requirements: {
        experience: '5+ years',
        education: 'Bachelor\'s degree in Business or related field',
        skills: ['Product Management', 'Agile', 'Analytics'],
      },
      company: 'Meta',
      applications_count: 8,
      isApplied: false,
    },
  ];

  const filteredJobs = jobs.filter(
    (job) =>
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.positions.some(pos => pos.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setIsDetailModalOpen(true);
  };

  const handleApply = (job) => {
    // Navigate to wizard with pre-selected job
    window.location.href = `/wizard/job?jobId=${job.id}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Opportunities</h1>
          <p className="text-gray-600">
            Browse and apply for job opportunities around the world.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jobs by name, company, country, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{job.name}</CardTitle>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <Building className="h-4 w-4 mr-1" />
                    {job.company}
                  </div>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.country}
                  </div>
                </div>
                {job.isApplied && (
                  <Badge variant="success">Applied</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Positions */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Positions:</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.positions.slice(0, 2).map((position, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {position}
                      </Badge>
                    ))}
                    {job.positions.length > 2 && (
                      <Badge variant="outline" size="sm">
                        +{job.positions.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Fee */}
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Fee: {job.fee === 0 ? 'Free' : `$${job.fee}`}
                </div>

                {/* Deadline */}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  Deadline: {new Date(job.deadline).toLocaleDateString()}
                </div>

                {/* Applications */}
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-1" />
                  {job.applications_count} applications
                </div>

                {/* Description Preview */}
                <div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {job.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(job)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  {!job.isApplied ? (
                    <Button
                      size="sm"
                      onClick={() => handleApply(job)}
                      className="flex-1"
                    >
                      Apply Now
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      Applied
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedJob?.name}
        size="lg"
      >
        {selectedJob && (
          <div className="space-y-6">
            {/* Job Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <p className="mt-1 text-sm text-gray-900">{selectedJob.company}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <p className="mt-1 text-sm text-gray-900">{selectedJob.country}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fee
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedJob.fee === 0 ? 'Free' : `$${selectedJob.fee}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Deadline
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedJob.deadline).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Applications
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedJob.applications_count} applications
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  {selectedJob.isApplied ? (
                    <Badge variant="success">Applied</Badge>
                  ) : (
                    <Badge variant="primary">Available</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Positions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Positions
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedJob.positions.map((position, index) => (
                  <Badge key={index} variant="primary">
                    {position}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                {selectedJob.description}
              </p>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Experience: </span>
                  <span className="text-gray-900">{selectedJob.requirements.experience}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Education: </span>
                  <span className="text-gray-900">{selectedJob.requirements.education}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Skills: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedJob.requirements.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              {!selectedJob.isApplied ? (
                <Button onClick={() => handleApply(selectedJob)}>
                  Apply Now
                </Button>
              ) : (
                <Button disabled>
                  Already Applied
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApplicantJobsPage;


