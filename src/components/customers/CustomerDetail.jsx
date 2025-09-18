import React, { useState, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit3, Plus, Users, Building, Phone, Mail, 
  Calendar, FileText, Settings, ExternalLink, Trash2 
} from 'lucide-react';
import { useCustomer } from '../../hooks/useCustomers';
import { useCalls } from '../../hooks/useCalls';
import { useLabels } from '../../hooks/useLabels';
import Modal, { ConfirmModal } from '../common/Modal';
import CustomerForm from './CustomerForm';
import { customerService } from '../../services/customerService';
import LoadingModal from '../common/LoadingModal';

const CustomerDetail = memo(() => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  
  const { 
    customer, 
    relationships, 
    loading, 
    updateCustomer, 
    addRelationship, 
    removeRelationship,
    updateCustomFields,
    assignLabel,
    deassignLabel,
  } = useCustomer(customerId);
  
  const { labels } = useLabels();

  const {
    callHistory,
    scheduledCalls,
    callStats,
    loading: callsLoading,
    addCallToHistory,
    scheduleCall,
    updateScheduledCall,
    cancelScheduledCall,
    completeScheduledCall,
    deleteCallHistory,
  } = useCalls(customerId);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showScheduleCallModal, setShowScheduleCallModal] = useState(false);
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [relationshipSearchTerm, setRelationshipSearchTerm] = useState('');
  const [relationshipSearchResults, setRelationshipSearchResults] = useState([]);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showDeleteCallModal, setShowDeleteCallModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [callToDelete, setCallToDelete] = useState(null);
  const [isDeletingCall, setIsDeletingCall] = useState(false);
  const [isLoggingCall, setIsLoggingCall] = useState(false);
  const [isSchedulingCall, setIsSchedulingCall] = useState(false);
  const [callFormData, setCallFormData] = useState({
    callType: 'outbound',
    status: 'completed',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    outcome: ''
  });
  const [scheduleFormData, setScheduleFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    priority: 'medium',
    purpose: ''
  });
  const [meetingFormData, setMeetingFormData] = useState({
    title: '',
    date: '',
    time: '',
    type: 'meeting',
    notes: '',
    meetingLink: ''
  });
  const [noteFormData, setNoteFormData] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  // Handler functions
  const handleEditCustomer = useCallback(() => {
    setShowEditModal(true);
  }, []);

  const handleSaveCustomer = useCallback(async (customerData, setLoading) => {
    try {
      setLoading(true);
      await updateCustomer(customerData);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to save customer:', error);
    } finally {
      setLoading(false);
    }
  }, [updateCustomer]);

  const handleAddRelationship = useCallback(() => {
    setShowRelationshipModal(true);
    setRelationshipSearchTerm('');
    setRelationshipSearchResults([]);
  }, []);

  const handleRelationshipSearch = useCallback(async () => {
    if (relationshipSearchTerm.trim() === '') {
      setRelationshipSearchResults([]);
      return;
    }
    try {
      const results = await customerService.searchCustomersByName(relationshipSearchTerm);
      // Filter out the current customer from the results
      setRelationshipSearchResults(results.filter(c => c.id !== customerId));
    } catch (error)      console.error("Failed to search for relationships:", error);
      setRelationshipSearchResults([]);
    }
  }, [relationshipSearchTerm, customerId]);

  const handleAddRelation = useCallback(async (relatedCustomerId) => {
    try {
      await addRelationship(relatedCustomerId);
      setShowRelationshipModal(false);
    } catch (error) {
      console.error('Failed to add relationship:', error);
    }
  }, [addRelationship]);

  const handleRemoveRelationship = useCallback(async (relationshipId) => {
    try {
      await removeRelationship(relationshipId);
    } catch (error) {
      console.error('Failed to remove relationship:', error);
    }
  }, [removeRelationship]);

  const handleScheduleMeeting = useCallback(() => {
    setShowAddMeetingModal(true);
  }, []);

  const handleAddNote = useCallback(() => {
    setShowAddNoteModal(true);
  }, []);

  const handleMeetingFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      // TODO: Implement meeting service
      console.log('Meeting scheduled:', meetingFormData);
      setShowAddMeetingModal(false);
      setMeetingFormData({
        title: '',
        date: '',
        time: '',
        type: 'meeting',
        notes: '',
        meetingLink: ''
      });
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
    }
  }, [meetingFormData]);

  const handleNoteFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      // TODO: Implement note service
      console.log('Note added:', noteFormData);
      setShowAddNoteModal(false);
      setNoteFormData({
        title: '',
        content: '',
        category: 'general'
      });
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  }, [noteFormData]);

  const handleAddCustomField = useCallback(() => {
    console.log('Add custom field clicked');
  }, []);

  const handleLogCall = useCallback(() => {
    setShowCallModal(true);
  }, []);

  const handleScheduleCall = useCallback(() => {
    setShowScheduleCallModal(true);
  }, []);

  const handleCallFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoggingCall(true);
    try {
      if (callFormData.scheduledCallId) {
        if (callFormData.status === 'completed') {
          await completeScheduledCall(callFormData.scheduledCallId, {
            notes: callFormData.outcome,
            duration: callFormData.duration,
          });
        } else {
          await addCallToHistory({
            date: callFormData.date,
            time: new Date().toLocaleTimeString(),
            duration: `${callFormData.duration} min`,
            status: callFormData.status,
            outcome: callFormData.outcome,
            callType: callFormData.callType,
            linkedScheduledCall: callFormData.scheduledCallId,
          });
          await cancelScheduledCall(callFormData.scheduledCallId);
          if (callFormData.status === 'postponed') {
            setShowScheduleCallModal(true);
          }
        }
      } else {
        await addCallToHistory({
          date: callFormData.date,
          time: new Date().toLocaleTimeString(),
          duration: `${callFormData.duration} min`,
          status: callFormData.status,
          outcome: callFormData.outcome,
          callType: callFormData.callType,
          linkedScheduledCall: null,
        });
        if (callFormData.status === 'postponed') {
          setShowScheduleCallModal(true);
        }
      }

      setShowCallModal(false);
      setCallFormData({
        callType: 'outbound',
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        duration: '',
        outcome: '',
        scheduledCallId: null,
      });
    } catch (error) {
      console.error('Failed to log call:', error);
    } finally {
      setIsLoggingCall(false);
    }
  }, [callFormData, addCallToHistory, completeScheduledCall, cancelScheduledCall]);

  const handleScheduleFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSchedulingCall(true);
    try {
      await scheduleCall({
        scheduledDate: scheduleFormData.scheduledDate,
        scheduledTime: scheduleFormData.scheduledTime,
        priority: scheduleFormData.priority,
        purpose: scheduleFormData.purpose
      });
      setShowScheduleCallModal(false);
      setScheduleFormData({
        scheduledDate: '',
        scheduledTime: '',
        priority: 'medium',
        purpose: ''
      });
    } catch (error) {
      console.error('Failed to schedule call:', error);
    } finally {
      setIsSchedulingCall(false);
    }
  }, [scheduleFormData, scheduleCall]);

  const handleCancelScheduledCall = useCallback(async (callId) => {
    try {
      await cancelScheduledCall(callId);
    } catch (error) {
      console.error('Failed to cancel call:', error);
    }
  }, [cancelScheduledCall]);

  const handleDeleteCall = useCallback((callId) => {
    setCallToDelete(callId);
    setShowDeleteCallModal(true);
  }, []);

  const confirmDeleteCall = useCallback(async () => {
    if (callToDelete) {
      setIsDeletingCall(true);
      try {
        await deleteCallHistory(callToDelete);
        setShowDeleteCallModal(false);
        setCallToDelete(null);
      } catch (error) {
        console.error('Failed to delete call:', error);
      } finally {
        setIsDeletingCall(false);
      }
    }
  }, [callToDelete, deleteCallHistory]);

  // Remove mock data - using Firebase data instead

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'no_answer':
        return 'bg-yellow-100 text-yellow-800';
      case 'postponed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'no_answer':
        return 'No Answer';
      case 'postponed':
        return 'Postponed';
      default:
        return 'Unknown';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Users },
    { key: 'calls', label: 'Call History', icon: Phone },
    { key: 'appointments', label: 'Appointments', icon: Calendar },
    { key: 'notes', label: 'Notes', icon: FileText },
    { key: 'custom', label: 'Custom Fields', icon: Settings }
  ];

  const getTypeIcon = (type) => {
    return type === 'CPA' ? 
      <Building className="w-4 h-4 text-blue-600" /> : 
      <Users className="w-4 h-4 text-gray-600" />;
  };

  // Loading state
  if (loading) {
    return <LoadingModal isOpen={true} />;
  }

  // Customer not found state
  if (!customer && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Not Found</h2>
            <p className="text-gray-600 mb-6">The customer you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/customers')}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Customers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <LoadingModal isOpen={callsLoading} message="Loading calls..." />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-800">
                  {customer?.name?.charAt(0)}{customer?.surname?.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {customer?.title} {customer?.name} {customer?.surname}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {getTypeIcon(customer?.type)}
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    customer?.type === 'CPA' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {customer?.type}
                  </span>
                  {customer?.cpaNumber && (
                    <span className="text-sm text-gray-600">
                      • {customer.cpaNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={handleEditCustomer}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit Customer
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-3 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Information */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customer?.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="text-gray-900">{customer.email}</p>
                          </div>
                        </div>
                      )}
                      {customer?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">Phone</p>
                            <div className="flex items-center gap-2">
                              <p className="text-gray-900">{customer.phone}</p>
                              <a
                                href={`tel:${customer.phone}`}
                                className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                Call
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                        <div className="flex items-center gap-3">
                            <ExternalLink className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-600">Line ID</p>
                                <p className="text-gray-900">{customer.lineID || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ExternalLink className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-600">Customer ID</p>
                                <p className="text-gray-900">{customer.customerID || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 col-span-2">
                          <ExternalLink className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Address</p>
                            <p className="text-gray-900">{customer.address || 'N/A'}</p>
                          </div>
                        </div>
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Company Name</p>
                          <p className="text-gray-900">{customer.companyName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Company ID</p>
                          <p className="text-gray-900">{customer.companyId || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 col-span-2">
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Company Address</p>
                          <p className="text-gray-900">{customer.companyAddress || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Labels</h3>
                      <button
                        onClick={() => setShowLabelModal(true)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Manage Labels
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {customer?.labels?.map((labelId) => {
                        const label = labels.find((l) => l.id === labelId);
                        if (!label) return null;
                        return (
                          <span
                            key={label.id}
                            className="px-3 py-1 text-sm font-medium rounded-full"
                            style={{ backgroundColor: label.color, color: '#ffffff' }}
                          >
                            {label.name}
                          </span>
                        );
                      })}
                      {(!customer?.labels || customer.labels.length === 0) && (
                        <p className="text-gray-600">No labels assigned.</p>
                      )}
                    </div>
                  </div>

                  {/* Relationships */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Related {customer?.type === 'CPA' ? 'NonCPA Clients' : 'CPA Professionals'}
                      </h3>
                      <button 
                        onClick={handleAddRelationship}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Relationship
                      </button>
                    </div>
                    <div className="space-y-3">
                      {relationships && relationships.length > 0 ? (
                        relationships.map((relation) => (
                          <div key={relation.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-3">
                              {getTypeIcon(relation.type)}
                              <div>
                                <p className="font-medium text-gray-900">{relation.name} {relation.surname}</p>
                                <p className="text-sm text-gray-600">{relation.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRemoveRelationship(relation.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-600">
                          No relationships found
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Meetings</p>
                        <p className="text-2xl font-bold text-gray-900">0</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Activity</p>
                        <p className="text-gray-900">
                          {customer?.lastActivity ? new Date(customer.lastActivity).toLocaleDateString() : 'No activity'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Customer Since</p>
                        <p className="text-gray-900">
                          {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">How Nice</p>
                        <p className="text-gray-900">{customer.howNice ? `${customer.howNice}/10` : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <button 
                        onClick={handleScheduleMeeting}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule Meeting
                      </button>
                      <button 
                        onClick={handleAddNote}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Add Note
                      </button>
                      <button 
                        onClick={handleAddRelationship}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Relationship
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Call History Tab */}
            {activeTab === 'calls' && (
              <div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Call History Section */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Call History</h3>
                      <button 
                        onClick={handleLogCall}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Log Call
                      </button>
                    </div>
                    <div className="space-y-4">
                      {callHistory && callHistory.length > 0 ? (
                        callHistory.map((call) => (
                          <div key={call.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Phone className="w-4 h-4 text-gray-600" />
                                  <span className="font-medium text-gray-900">
                                    {call.callType === 'inbound' ? 'Incoming Call' : 'Outgoing Call'}
                                  </span>
                                  {customer?.phone && (
                                    <a
                                      href={`tel:${customer.phone}`}
                                      className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors ml-2"
                                    >
                                      <Phone className="w-3 h-3 mr-1" />
                                      Call Again
                                    </a>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {call.date instanceof Date ? call.date.toLocaleDateString() : call.date} at {call.time} • Duration: {call.duration}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(call.status)}`}>
                                  {getStatusText(call.status)}
                                </span>
                                <button
                                  onClick={() => handleDeleteCall(call.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {call.outcome && (
                              <div className="mt-2 p-3 bg-white rounded border-l-4 border-blue-500">
                                <p className="text-sm text-gray-700">{call.outcome}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <p className="text-gray-600 text-center">No call history available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduled Calls Section */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Scheduled Calls</h3>
                      <button 
                        onClick={handleScheduleCall}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule Call
                      </button>
                    </div>
                    <div className="space-y-4">
                      {scheduledCalls && scheduledCalls.filter(c => c.status !== 'completed').length > 0 ? (
                        scheduledCalls.filter(c => c.status !== 'completed').map((call) => (
                          <div key={call.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="w-4 h-4 text-green-600" />
                                  <span className="font-medium text-gray-900">
                                    Scheduled Call
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {call.scheduledDate instanceof Date ? call.scheduledDate.toLocaleDateString() : call.scheduledDate} at {call.scheduledTime}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(call.priority)}`}>
                                {call.priority} priority
                              </span>
                            </div>
                            <div className="mt-2 p-3 bg-white rounded">
                              <p className="text-sm text-gray-700">{call.purpose}</p>
                            </div>
                            <div className="flex justify-end mt-3 gap-2">
                              <button className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                Edit
                              </button>
                              <button 
                                onClick={() => handleCancelScheduledCall(call.id)}
                                className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <p className="text-gray-600 text-center">No scheduled calls</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Call Statistics */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Total Calls</p>
                        <p className="text-xl font-bold text-gray-900">{callStats.totalCalls}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="text-xl font-bold text-gray-900">{callStats.completed}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div>
                        <p className="text-sm text-gray-600">No Answer</p>
                        <p className="text-xl font-bold text-gray-900">{callStats.noAnswer}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Scheduled</p>
                        <p className="text-xl font-bold text-gray-900">{callStats.scheduled}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Meetings Section */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Meetings & Appointments</h3>
                      <button 
                        onClick={handleScheduleMeeting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Schedule Meeting
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-600 text-center">No meetings scheduled yet</p>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Calls Section */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Scheduled Calls</h3>
                      <button 
                        onClick={handleScheduleCall}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule Call
                      </button>
                    </div>
                    <div className="space-y-4">
                      {scheduledCalls && scheduledCalls.length > 0 ? (
                        scheduledCalls.map((call) => (
                          <div key={call.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Phone className="w-4 h-4 text-green-600" />
                                  <span className="font-medium text-gray-900">
                                    Scheduled Call
                                  </span>
                                  {customer?.phone && (
                                    <a
                                      href={`tel:${customer.phone}`}
                                      className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors ml-2"
                                    >
                                      <Phone className="w-3 h-3 mr-1" />
                                      Call Now
                                    </a>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {call.scheduledDate instanceof Date ? call.scheduledDate.toLocaleDateString() : call.scheduledDate} at {call.scheduledTime}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(call.priority)}`}>
                                {call.priority} priority
                              </span>
                            </div>
                            <div className="mt-2 p-3 bg-white rounded">
                              <p className="text-sm text-gray-700">{call.purpose}</p>
                            </div>
                            <div className="flex justify-end mt-3 gap-2">
                              <button className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                Edit
                              </button>
                              <button 
                                onClick={() => handleCancelScheduledCall(call.id)}
                                className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <p className="text-gray-600 text-center">No scheduled calls</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Combined Statistics */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Total Meetings</p>
                        <p className="text-xl font-bold text-gray-900">0</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Scheduled Calls</p>
                        <p className="text-xl font-bold text-gray-900">{callStats.scheduled}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">This Week</p>
                        <p className="text-xl font-bold text-gray-900">0</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Customer Notes</h3>
                  <button 
                    onClick={handleAddNote}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Note
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-600 text-center">No notes available</p>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Fields Tab */}
            {activeTab === 'custom' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Custom Fields</h3>
                  <button 
                    onClick={handleAddCustomField}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer?.customFields && Object.keys(customer.customFields).length > 0 ? (
                    Object.entries(customer.customFields).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1 capitalize">
                          {key.replace('_', ' ')}
                        </p>
                        <p className="text-gray-900 font-medium">{value}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 bg-gray-50 rounded-lg p-6">
                      <p className="text-gray-600 text-center">No custom fields added yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Customer Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Customer"
          size="xl"
        >
          <CustomerForm
            customer={customer}
            onSave={handleSaveCustomer}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal>

        {/* Delete Call Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteCallModal}
          onClose={() => setShowDeleteCallModal(false)}
          onConfirm={confirmDeleteCall}
          title="Delete Call Log"
          message="Are you sure you want to delete this call log? This action cannot be undone."
          loading={isDeletingCall}
        />

        {/* Add Relationship Modal */}
        <Modal
          isOpen={showRelationshipModal}
          onClose={() => setShowRelationshipModal(false)}
          title="Add Relationship"
          size="md"
        >
          <div className="p-2">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Search for a customer to add..."
                value={relationshipSearchTerm}
                onChange={(e) => setRelationshipSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRelationshipSearch()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleRelationshipSearch} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                Search
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {relationshipSearchResults.length > 0 ? (
                relationshipSearchResults.map(result => (
                  <div key={result.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{result.name} {result.surname}</p>
                      <p className="text-sm text-gray-500">{result.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddRelation(result.id)}
                      className="px-3 py-1 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No search results</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">Can't find the customer?</p>
              <button
                onClick={() => {
                  setShowRelationshipModal(false);
                  setShowEditModal(true); // Open the customer form to add a new one
                }}
                className="text-blue-600 hover:underline"
              >
                + Add a new customer
              </button>
            </div>
          </div>
        </Modal>

        {/* Add Meeting Modal */}
        <Modal
          isOpen={showAddMeetingModal}
          onClose={() => setShowAddMeetingModal(false)}
          title="Schedule Meeting"
          size="lg"
        >
          <form onSubmit={handleMeetingFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Title *</label>
              <input
                type="text"
                value={meetingFormData.title}
                onChange={(e) => setMeetingFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Tax Planning Discussion"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={meetingFormData.date}
                  onChange={(e) => setMeetingFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                <input
                  type="time"
                  value={meetingFormData.time}
                  onChange={(e) => setMeetingFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label>
              <select 
                value={meetingFormData.type}
                onChange={(e) => setMeetingFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="meeting">In-Person Meeting</option>
                <option value="video_call">Video Call</option>
                <option value="phone_call">Phone Call</option>
                <option value="consultation">Consultation</option>
                <option value="review">Review Meeting</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link (for video calls)</label>
              <input
                type="url"
                value={meetingFormData.meetingLink}
                onChange={(e) => setMeetingFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                placeholder="https://zoom.us/j/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Notes</label>
              <textarea
                rows={3}
                value={meetingFormData.notes}
                onChange={(e) => setMeetingFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Agenda items, preparation notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddMeetingModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Schedule Meeting
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Note Modal */}
        <Modal
          isOpen={showAddNoteModal}
          onClose={() => setShowAddNoteModal(false)}
          title="Add Note"
          size="lg"
        >
          <form onSubmit={handleNoteFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note Title *</label>
              <input
                type="text"
                value={noteFormData.title}
                onChange={(e) => setNoteFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Client Preferences, Important Information"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select 
                value={noteFormData.category}
                onChange={(e) => setNoteFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="meeting">Meeting Notes</option>
                <option value="call">Call Notes</option>
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="follow_up">Follow Up</option>
                <option value="important">Important</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note Content *</label>
              <textarea
                rows={6}
                value={noteFormData.content}
                onChange={(e) => setNoteFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your note content here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddNoteModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Note
              </button>
            </div>
          </form>
        </Modal>

        {/* Log Call Modal */}
        <Modal
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          title="Log Call"
          size="lg"
        >
          <form onSubmit={handleCallFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link to Scheduled Call (Optional)</label>
              <select
                onChange={(e) => {
                  const callId = e.target.value;
                  if (callId) {
                    const selectedCall = scheduledCalls.find(c => c.id === callId);
                    if (selectedCall) {
                      setCallFormData(prev => ({
                        ...prev,
                        scheduledCallId: callId,
                        outcome: selectedCall.purpose,
                      }));
                    }
                  } else {
                    setCallFormData(prev => ({
                      ...prev,
                      scheduledCallId: null,
                      outcome: '',
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a scheduled call</option>
                {scheduledCalls.filter(c => c.status !== 'completed').map(call => (
                  <option key={call.id} value={call.id}>
                    {call.purpose} - {new Date(call.scheduledDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Type</label>
                <select 
                  value={callFormData.callType}
                  onChange={(e) => setCallFormData(prev => ({ ...prev, callType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="outbound">Outbound Call</option>
                  <option value="inbound">Inbound Call</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Status</label>
                <select 
                  value={callFormData.status}
                  onChange={(e) => setCallFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="completed">Completed</option>
                  <option value="no_answer">No Answer</option>
                  <option value="postponed">Postponed</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={callFormData.date}
                  onChange={(e) => setCallFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  placeholder="15"
                  value={callFormData.duration}
                  onChange={(e) => setCallFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Call Notes</label>
              <textarea
                rows={4}
                placeholder="Enter call notes and outcomes..."
                value={callFormData.outcome}
                onChange={(e) => setCallFormData(prev => ({ ...prev, outcome: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={isLoggingCall}
              >
                {isLoggingCall ? 'Logging...' : 'Log Call'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Label Assignment Modal */}
        <LabelAssignmentModal
          isOpen={showLabelModal}
          onClose={() => setShowLabelModal(false)}
          labels={labels}
          customerLabels={customer?.labels}
          onAssign={assignLabel}
          onDeassign={deassignLabel}
        />

        {/* Schedule Call Modal */}
        <Modal
          isOpen={showScheduleCallModal}
          onClose={() => setShowScheduleCallModal(false)}
          title="Schedule Call"
          size="lg"
        >
          <form onSubmit={handleScheduleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={scheduleFormData.scheduledDate}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={scheduleFormData.scheduledTime}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select 
                value={scheduleFormData.priority}
                onChange={(e) => setScheduleFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purpose/Notes</label>
              <textarea
                rows={3}
                placeholder="Purpose of the call and any notes..."
                value={scheduleFormData.purpose}
                onChange={(e) => setScheduleFormData(prev => ({ ...prev, purpose: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowScheduleCallModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={isSchedulingCall}
              >
                {isSchedulingCall ? 'Scheduling...' : 'Schedule Call'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
});

const LabelAssignmentModal = ({
  isOpen,
  onClose,
  labels,
  customerLabels,
  onAssign,
  onDeassign,
}) => {
  const navigate = useNavigate();
  const handleLabelToggle = (labelId, isAssigned) => {
    if (isAssigned) {
      onDeassign(labelId);
    } else {
      onAssign(labelId);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Labels">
      <div className="space-y-3">
        {labels.length > 0 ? (
          labels.map((label) => {
            const isAssigned = customerLabels?.includes(label.id);
            return (
              <div key={label.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: label.color }}
                  ></span>
                  <span>{label.name}</span>
                </div>
                <input
                  type="checkbox"
                  checked={isAssigned}
                  onChange={() => handleLabelToggle(label.id, isAssigned)}
                  className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>
            );
          })
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">No labels have been created yet.</p>
            <button
              onClick={() => {
                onClose();
                navigate('/labels');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create a Label
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CustomerDetail;