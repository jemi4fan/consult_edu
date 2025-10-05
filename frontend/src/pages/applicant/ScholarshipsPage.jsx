import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import {
  GraduationCap,
  Search,
  Filter,
  Eye,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Building,
} from 'lucide-react';

const ApplicantScholarshipsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Mock data - replace with actual API calls
  const scholarships = [
    {
      id: 1,
      name: 'Harvard MBA Scholarship',
      programs: ['MBA', 'Executive MBA'],
      country: 'United States',
      universityName: 'Harvard Business School',
      logo: '/api/placeholder/64/64',
      intakeDate: '2024-09-01',
      deadline: '2024-03-15',
      majors: ['Business Administration', 'Management', 'Finance'],
      description: 'Full scholarship for MBA program at Harvard Business School.',
      fee: 0,
      status: 'published',
      applications_count: 156,
      isApplied: false,
    },
    {
      id: 2,
      name: 'MIT PhD Fellowship',
      programs: ['PhD'],
      country: 'United States',
      universityName: 'Massachusetts Institute of Technology',
      logo: '/api/placeholder/64/64',
      intakeDate: '2024-09-01',
      deadline: '2024-02-28',
      majors: ['Computer Science', 'Engineering', 'Physics'],
      description: 'Fully funded PhD fellowship in various engineering and science disciplines.',
      fee: 0,
      status: 'published',
      applications_count: 89,
      isApplied: true,
    },
    {
      id: 3,
      name: 'Oxford Masters Scholarship',
      programs: ['Master\'s', 'MPhil'],
      country: 'United Kingdom',
      universityName: 'University of Oxford',
      logo: '/api/placeholder/64/64',
      intakeDate: '2024-10-01',
      deadline: '2024-04-01',
      majors: ['Literature', 'History', 'Philosophy'],
      description: 'Partial scholarship for Master\'s programs in humanities.',
      fee: 5000,
      status: 'published',
      applications_count: 34,
      isApplied: false,
    },
  ];

  const filteredScholarships = scholarships.filter(
    (scholarship) =>
      scholarship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholarship.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholarship.universityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholarship.programs.some(program => program.toLowerCase().includes(searchTerm.toLowerCase())) ||
      scholarship.majors.some(major => major.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewDetails = (scholarship) => {
    setSelectedScholarship(scholarship);
    setIsDetailModalOpen(true);
  };

  const handleApply = (scholarship) => {
    // Navigate to wizard with pre-selected scholarship
    window.location.href = `/wizard/scholarship?scholarshipId=${scholarship.id}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scholarship Opportunities</h1>
          <p className="text-gray-600">
            Browse and apply for scholarship opportunities around the world.
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
                  placeholder="Search scholarships by name, university, program, or major..."
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

      {/* Scholarships Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredScholarships.map((scholarship) => (
          <Card key={scholarship.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg line-clamp-2">{scholarship.name}</CardTitle>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Building className="h-4 w-4 mr-1" />
                      {scholarship.universityName}
                    </div>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      {scholarship.country}
                    </div>
                  </div>
                </div>
                {scholarship.isApplied && (
                  <Badge variant="success">Applied</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Programs */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Programs:</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {scholarship.programs.slice(0, 2).map((program, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {program}
                      </Badge>
                    ))}
                    {scholarship.programs.length > 2 && (
                      <Badge variant="outline" size="sm">
                        +{scholarship.programs.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Majors */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Majors:</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {scholarship.majors.slice(0, 2).map((major, index) => (
                      <Badge key={index} variant="secondary" size="sm">
                        {major}
                      </Badge>
                    ))}
                    {scholarship.majors.length > 2 && (
                      <Badge variant="secondary" size="sm">
                        +{scholarship.majors.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Intake Date */}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  Intake: {new Date(scholarship.intakeDate).toLocaleDateString()}
                </div>

                {/* Deadline */}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
                </div>

                {/* Fee */}
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Fee: {scholarship.fee === 0 ? 'Free' : `$${scholarship.fee}`}
                </div>

                {/* Applications */}
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-1" />
                  {scholarship.applications_count} applications
                </div>

                {/* Description Preview */}
                <div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {scholarship.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(scholarship)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  {!scholarship.isApplied ? (
                    <Button
                      size="sm"
                      onClick={() => handleApply(scholarship)}
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

      {/* Scholarship Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedScholarship?.name}
        size="lg"
      >
        {selectedScholarship && (
          <div className="space-y-6">
            {/* Scholarship Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  University
                </label>
                <p className="mt-1 text-sm text-gray-900">{selectedScholarship.universityName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <p className="mt-1 text-sm text-gray-900">{selectedScholarship.country}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fee
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedScholarship.fee === 0 ? 'Free' : `$${selectedScholarship.fee}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Applications
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedScholarship.applications_count} applications
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Intake Date
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedScholarship.intakeDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Deadline
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedScholarship.deadline).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  {selectedScholarship.isApplied ? (
                    <Badge variant="success">Applied</Badge>
                  ) : (
                    <Badge variant="primary">Available</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Programs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Programs
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedScholarship.programs.map((program, index) => (
                  <Badge key={index} variant="primary">
                    {program}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Majors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligible Majors
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedScholarship.majors.map((major, index) => (
                  <Badge key={index} variant="outline">
                    {major}
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
                {selectedScholarship.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              {!selectedScholarship.isApplied ? (
                <Button onClick={() => handleApply(selectedScholarship)}>
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

export default ApplicantScholarshipsPage;


