import { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Card,
    CardContent,
    Grid,
    Paper,
    Divider,
} from '@mui/material';
import {
    DownloadCloud,
    Trash2,
    Database,
    Clock,
    FileText,
} from 'lucide-react';
import axios from 'axios';

export const DataForm = ({ integrationType, credentials }) => {
    const [loadedData, setLoadedData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLoad = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('credentials', JSON.stringify(credentials));
            const response = await axios.post(
                `http://localhost:8000/integrations/${integrationType.toLowerCase()}/load`,
                formData
            );
            setLoadedData(response.data);
        } catch (e) {
            alert(e?.response?.data?.detail || 'Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper
            elevation={3}
            sx={{
                p: 4,
                borderRadius: 4,
                width: '100%',
                maxWidth: 1000,
                mt: 4,
                mb: 4,
            }}
        >
            <Typography variant="h5" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                <Database size={22} />
                {integrationType} Data Loader
            </Typography>

            <Box display="flex" gap={2} mb={3}>
                <Button
                    onClick={handleLoad}
                    variant="contained"
                    startIcon={<DownloadCloud size={18} />}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Load Data'}
                </Button>

                <Button
                    onClick={() => setLoadedData(null)}
                    variant="outlined"
                    color="secondary"
                    startIcon={<Trash2 size={18} />}
                    disabled={!loadedData}
                >
                    Clear Data
                </Button>
            </Box>

            {loadedData && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" fontWeight={500} mb={2}>
                        Loaded {loadedData.length} item{loadedData.length > 1 ? 's' : ''} from {integrationType}
                    </Typography>
                    <Grid container spacing={2}>
                        {loadedData.map((item, idx) => (
                            <Grid item xs={12} sm={6} md={4} key={item.id || idx}>
                                <Card
                                    variant="outlined"
                                    sx={{ height: '100%', borderRadius: 2, p: 1 }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="subtitle2"
                                            color="text.secondary"
                                            gutterBottom
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                        >
                                            <FileText size={16} />
                                            {item.id}
                                        </Typography>
                                        <Typography variant="h6" gutterBottom>
                                            {item.name || 'Unnamed Item'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Type: <strong>{item.type}</strong>
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                        >
                                            <Clock size={14} />
                                            Created: {item.creation_time || 'N/A'}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                        >
                                            <Clock size={14} />
                                            Updated: {item.last_modified_time || 'N/A'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}
        </Paper>
    );
};
